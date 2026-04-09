"""Chat endpoints router."""

import logging

from fastapi import APIRouter, HTTPException
from openai import APIConnectionError, APIStatusError, AuthenticationError, RateLimitError

from src.schemas.chat import ChatRequest, ChatResponse, HealthResponse, ResetResponse
from src.services.openai_service import get_openai_service
from src.settings import get_backend_version

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["chat"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    logger.debug("Health check")
    return HealthResponse(status="ok", version=get_backend_version())


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message and get AI response.

    Args:
        request: ChatRequest with message and conversation_id

    Returns:
        ChatResponse with reply and conversation_id

    Raises:
        HTTPException: For various error conditions
    """
    # Validate input
    message = (request.message or "").strip()
    if not message:
        logger.warning("Empty message received")
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )

    conversation_id = (request.conversation_id or "").strip() or "default"

    logger.info(
        f"Chat request: conversation_id={conversation_id}, "
        f"message_length={len(message)}"
    )

    try:
        # Get OpenAI service
        service = get_openai_service()

        # Call OpenAI API
        reply = await service.chat(
            message=message,
            conversation_id=conversation_id,
        )

        logger.info(
            f"Chat response: conversation_id={conversation_id}, "
            f"reply_length={len(reply)}"
        )

        return ChatResponse(
            reply=reply,
            conversation_id=conversation_id,
        )

    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except AuthenticationError as e:
        logger.error(f"OpenAI authentication error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed with OpenAI API"
        )

    except RateLimitError as e:
        logger.warning(f"OpenAI rate limit exceeded: {e}")
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )

    except APIConnectionError as e:
        logger.error(f"OpenAI connection error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Could not connect to OpenAI API"
        )

    except APIStatusError as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=502,
            detail="OpenAI API returned an error"
        )

    except Exception as e:
        logger.exception(f"Unexpected error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@router.post("/reset", response_model=ResetResponse)
async def reset_conversation(request: ChatRequest):
    """Clear conversation history.

    Args:
        request: ChatRequest with conversation_id

    Returns:
        ResetResponse confirming reset

    Raises:
        HTTPException: For errors
    """
    conversation_id = (request.conversation_id or "").strip() or "default"

    logger.info(f"Reset request: conversation_id={conversation_id}")

    try:
        service = get_openai_service()
        service.clear_conversation(conversation_id)

        logger.info(f"Conversation cleared: {conversation_id}")

        return ResetResponse(
            ok=True,
            conversation_id=conversation_id,
        )

    except Exception as e:
        logger.exception(f"Error resetting conversation: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error clearing conversation"
        )
