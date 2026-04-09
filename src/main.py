import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

# Initialize logging first (before other imports)
from src.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

from src.deps import (
    set_openai_client_getter,
    set_user_service,
    set_auth_service,
    set_usage_service,
    set_subscription_service,
    set_payment_service,
)
from src.middleware.request_log import RequestLogMiddleware
from src.middleware.rate_limit import rate_limit_middleware
from src.middleware.auth import auth_middleware
from src.middleware.user_middleware import set_auth_service as set_user_auth_service, UserContextMiddleware
from src.middleware.usage_tracking import track_usage_middleware
from src.routers.chat import router as chat_router
from src.routers.users import router as users_router
from src.routers.admin import router as admin_router
from src.routers.versioned import ChatRequest, ChatResponse, create_version_router, run_chat, run_transcribe
from src.services.memory import store as conversation_store
from src.services.openai_service import init_openai_service
from src.services.user_service import UserService
from src.services.auth_service import AuthService
from src.services.usage_service import UsageService, set_usage_service as set_global_usage_service
from src.services.subscription_service import SubscriptionService
from src.services.payment_service import PaymentService
from src.storage.memory import MemoryStorage
from src.storage.file_backup import FileBackupStorage
from src.settings import get_backend_version
from src.config.db_config import get_engine, get_session_maker, init_db, verify_connection, close_db

_backend_root = Path(__file__).resolve().parent.parent
load_dotenv(_backend_root / ".env")


def _get_api_key() -> str | None:
    key = os.getenv("OPENAI_API_KEY")
    if key is None:
        return None
    key = key.strip()
    return key if key else None


_api_key = _get_api_key()
openai_client: AsyncOpenAI | None
if _api_key:
    openai_client = AsyncOpenAI(api_key=_api_key)
    print("DEBUG: OPENAI_API_KEY loaded successfully")
else:
    openai_client = None
    print(
        "DEBUG: OPENAI_API_KEY is missing or empty. "
        "Set it in the environment or in .env at the backend project root."
    )


@asynccontextmanager
async def lifespan(_: FastAPI):
    # ========================================================================
    # Initialize Database
    # ========================================================================
    try:
        db_engine = await get_engine()
        db_session_maker = await get_session_maker()

        # Verify database connection
        if await verify_connection(db_engine):
            logger.info("Database connection verified")

            # Initialize database (create tables if not exist)
            await init_db(db_engine)
            logger.info("Database initialized successfully")
        else:
            logger.warning("Database connection verification failed - proceeding anyway")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.warning("Continuing with in-memory storage only")

    # ========================================================================
    # Initialize OpenAI dependencies
    # ========================================================================
    set_openai_client_getter(lambda: openai_client, has_api_key=bool(_api_key))
    init_openai_service(openai_client)
    logger.info("OpenAI service initialized at startup")

    # ========================================================================
    # Initialize SaaS system
    # ========================================================================
    try:
        # Initialize storage
        saas_storage = MemoryStorage()
        file_backup = FileBackupStorage(saas_storage, backup_dir="./data")

        # Load backup if available
        await file_backup.load_backup()
        logger.info("SaaS storage initialized")

        # Initialize services
        user_service = UserService(saas_storage)
        auth_service = AuthService(user_service)
        usage_service = UsageService(saas_storage)
        subscription_service = SubscriptionService(saas_storage)
        payment_service = PaymentService(saas_storage)

        # Register services in dependency injection
        set_user_service(user_service)
        set_auth_service(auth_service)
        set_user_auth_service(auth_service)  # For middleware
        set_usage_service(usage_service)
        set_global_usage_service(usage_service)  # For global access
        set_subscription_service(subscription_service)
        set_payment_service(payment_service)

        logger.info("SaaS services initialized (user, auth, usage, subscription, payment)")

        # Save backup on startup
        await file_backup.save_backup()

    except Exception as e:
        logger.error(f"Failed to initialize SaaS system: {e}")
        # Continue even if SaaS fails (graceful degradation)

    yield

    # ========================================================================
    # Cleanup on shutdown
    # ========================================================================

    # Close database connections
    try:
        db_engine = await get_engine()
        await close_db(db_engine)
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Failed to close database: {e}")

    try:
        # Save final backup
        file_backup = FileBackupStorage(saas_storage, backup_dir="./data")
        await file_backup.save_backup()
        logger.info("SaaS data backed up at shutdown")
    except Exception as e:
        logger.error(f"Failed to save backup at shutdown: {e}")

    if openai_client is not None:
        await openai_client.close()
        logger.info("OpenAI client closed")


app = FastAPI(
    title="Nova Mind AI",
    description="Versioned API (/v1, /v2) with backward-compatible /chat",
    version=get_backend_version(),
    lifespan=lifespan,
)

app.add_middleware(RequestLogMiddleware)

# Rate limiting middleware (before auth to avoid charging rate-limited requests)
app.middleware("http")(rate_limit_middleware)

# Authentication middleware
app.middleware("http")(auth_middleware)

# ============================================================================
# SaaS System Middlewares
# ============================================================================

# User context middleware (extracts user from API key)
app.middleware("http")(lambda request, call_next: UserContextMiddleware()(request, call_next))

# Usage tracking middleware (tracks API calls per user)
app.middleware("http")(track_usage_middleware)

# Quota enforcement middleware (checks daily limits)
from src.middleware.quota_enforcement import enforce_quota_middleware

app.middleware("http")(enforce_quota_middleware)

# Admin auth middleware
from src.middleware.admin_auth import AdminAuthMiddleware

app.add_middleware(AdminAuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Register Routers
# ============================================================================

# Include versioned API routers
app.include_router(create_version_router("v1"))
app.include_router(create_version_router("v2"))

# Include production-ready chat router
app.include_router(chat_router)

# Include SaaS system routers
app.include_router(users_router)  # /api/users/* endpoints
app.include_router(admin_router)  # /admin/* endpoints


class ErrorBody(BaseModel):
    error: str
    detail: str | None = None


class ResetConversationRequest(BaseModel):
    conversation_id: str = "default"


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Nova Mind AI",
        "backend_version": get_backend_version(),
        "api": {
            "v1": "/v1/chat, /v1/voice/transcribe, /v1/app/config",
            "v2": "/v2/chat, /v2/voice/transcribe, /v2/app/config",
            "legacy": "/chat, /voice/transcribe (v1 behavior)",
        },
    }


@app.post(
    "/chat",
    response_model=ChatResponse,
    responses={
        400: {"model": ErrorBody},
        401: {"model": ErrorBody},
        429: {"model": ErrorBody},
        500: {"model": ErrorBody},
        502: {"model": ErrorBody},
        503: {"model": ErrorBody},
    },
    tags=["legacy"],
    deprecated=True,
    summary="Legacy chat — identical to POST /v1/chat",
)
async def legacy_chat(request: ChatRequest):
    return await run_chat(request, "v1")


@app.post(
    "/voice/transcribe",
    tags=["legacy"],
    deprecated=True,
    summary="Legacy transcribe — identical to POST /v1/voice/transcribe",
)
async def legacy_voice_transcribe(file: UploadFile = File(...)):
    return await run_transcribe(file)


@app.post("/conversation/reset", tags=["legacy"])
async def reset_conversation(body: ResetConversationRequest):
    """Clear server-side memory for a conversation_id."""
    cid = (body.conversation_id or "default").strip() or "default"
    conversation_store.clear(cid)
    return {"ok": True, "conversation_id": cid}


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        body = detail if "error" in detail else {"error": "request_error", **detail}
    elif isinstance(detail, list):
        body = {"error": "request_error", "detail": detail}
    else:
        body = {"error": "request_error", "detail": str(detail)}
    return JSONResponse(status_code=exc.status_code, content=body)
