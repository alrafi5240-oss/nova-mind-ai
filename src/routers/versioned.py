"""Versioned HTTP surface: /v1/* and /v2/* (+ shared chat runner for legacy /chat)."""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from openai import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    RateLimitError,
)
from pydantic import BaseModel, Field

from src.app_metadata import build_app_config
from src.deps import get_openai_client, has_openai_api_key
from src.feature_flags import get_feature_flags
from src.services.assistant import process_turn
from src.services.voice import transcribe_audio

logger = logging.getLogger(__name__)


async def lite_mode_reply(user_message: str, conversation_id: str) -> str:
    """Generate a simple reply without OpenAI (lite mode).

    Used when OpenAI is not available or lite mode is explicitly enabled.
    """
    from src.services.memory import store

    # Small delay so the existing typing indicator has time to show.
    await asyncio.sleep(0.35)

    # Simple conversational fallback when OpenAI is unavailable.
    reply = (
        f"I see. You said: \"{user_message[:100]}\"\n\n"
        "Tell me a bit more and I’ll help as best I can."
    )

    # Still log to conversation history for consistency
    store.append_exchange(conversation_id, user_message, reply)

    logger.info("lite_mode_reply conversation_id=%s user_chars=%s", conversation_id, len(user_message))
    return reply


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message")
    conversation_id: str | None = Field(
        default=None,
        description="Session id; last 10 messages are used as context",
    )


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str


class TranscribeResponse(BaseModel):
    text: str


async def run_chat(request: ChatRequest, api_version: str):
    """Shared handler for POST chat (legacy /chat and /v1/chat, /v2/chat).

    Supports two modes:
    - OpenAI: Full AI response via OpenAI API (requires OPENAI_API_KEY)
    - Lite: Simple echo-like response (fallback when OpenAI unavailable)
    """
    text = request.message.strip()
    if not text:
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_request", "detail": "Message cannot be empty"},
        )

    cid = (request.conversation_id or "default").strip() or "default"

    # ========================================================================
    # Determine which LLM provider to use
    # ========================================================================
    flags = get_feature_flags()
    provider = flags.llm_provider

    # If explicit lite mode requested, use it immediately
    if provider == "lite":
        reply = await lite_mode_reply(text, cid)
        logger.info(
            "chat api=%s mode=lite conversation_id=%s user_chars=%s",
            api_version,
            cid,
            len(text),
        )
        return ChatResponse(reply=reply, conversation_id=cid)

    # ========================================================================
    # OpenAI mode: Try OpenAI, fall back to lite if client unavailable
    # ========================================================================
    client = get_openai_client()
    if client is None:
        logger.warning(
            "OpenAI client unavailable, falling back to lite mode. "
            "Set OPENAI_API_KEY to enable full AI responses."
        )
        reply = await lite_mode_reply(text, cid)
        return ChatResponse(reply=reply, conversation_id=cid)

    try:
        reply = await process_turn(
            client,
            user_message=text,
            conversation_id=cid,
            api_version=api_version,
        )
        logger.info(
            "chat api=%s conversation_id=%s user_chars=%s reply_preview=%r",
            api_version,
            cid,
            len(text),
            (reply[:200] + "…") if len(reply) > 200 else reply,
        )
        return ChatResponse(reply=reply, conversation_id=cid)

    except AuthenticationError as e:
        logger.warning("OpenAI authentication failed: %s", e)
        return JSONResponse(
            status_code=401,
            content={
                "error": "authentication_failed",
                "detail": "Invalid or missing OpenAI API credentials.",
            },
        )

    except RateLimitError as e:
        logger.warning("OpenAI rate limit: %s", e)
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limited",
                "detail": "OpenAI rate limit exceeded. Try again shortly.",
            },
        )

    except APIConnectionError as e:
        logger.exception("OpenAI connection error: %s", e)
        return JSONResponse(
            status_code=503,
            content={
                "error": "upstream_unreachable",
                "detail": "Could not reach OpenAI. Check network connectivity.",
            },
        )

    except APIStatusError as e:
        logger.exception("OpenAI API error: %s", e)
        return JSONResponse(
            status_code=502,
            content={
                "error": "upstream_error",
                "detail": "OpenAI returned an error. Try again later.",
            },
        )

    except Exception:
        logger.exception("Unexpected chat error")
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_error",
                "detail": "An unexpected error occurred.",
            },
        )


async def run_transcribe(file: UploadFile):
    client = get_openai_client()
    if client is None:
        return JSONResponse(
            status_code=503,
            content={
                "error": "service_unavailable",
                "detail": "OpenAI is not configured. Set OPENAI_API_KEY.",
            },
        )

    if not get_feature_flags().voice_transcription:
        return JSONResponse(
            status_code=403,
            content={
                "error": "feature_disabled",
                "detail": "Voice transcription is disabled by the server.",
            },
        )

    raw = await file.read()
    if not raw:
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_request", "detail": "Empty audio file"},
        )

    name = file.filename or "audio.m4a"
    try:
        text = await transcribe_audio(client, raw, filename=name)
        return TranscribeResponse(text=text)
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_request", "detail": str(e)},
        )
    except Exception as e:
        logger.exception("Transcription failed: %s", e)
        return JSONResponse(
            status_code=502,
            content={
                "error": "transcription_failed",
                "detail": "Could not transcribe audio. Try again.",
            },
        )


def create_version_router(api_version: str) -> APIRouter:
    router = APIRouter(prefix=f"/{api_version}", tags=[api_version])

    @router.get("/app/config")
    async def app_config():
        """Mobile: feature flags, semver hints, changelog, store URLs."""
        return build_app_config()

    @router.post(
        "/chat",
        response_model=ChatResponse,
        responses={
            400: {"description": "Bad request"},
            401: {"description": "Auth failed"},
            429: {"description": "Rate limited"},
            500: {"description": "Server error"},
            502: {"description": "Upstream error"},
            503: {"description": "Unavailable"},
        },
    )
    async def chat(request: ChatRequest):
        return await run_chat(request, api_version)

    @router.post("/voice/transcribe", response_model=TranscribeResponse)
    async def voice_transcribe(file: UploadFile = File(...)):
        return await run_transcribe(file)

    return router
