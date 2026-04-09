"""Middleware for tracking user message usage."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import Request

from src.services.usage_service import UsageService

logger = logging.getLogger(__name__)


async def track_usage_middleware(request: Request, call_next):
    """Middleware to track message usage after successful API calls.

    Increments usage counter on successful chat requests.

    Args:
        request: FastAPI request
        call_next: Next middleware/endpoint

    Returns:
        Response
    """
    # Mark request start time
    request.state.start_time = __import__("time").time()

    # Get the response
    response = await call_next(request)

    # Only track on successful chat requests
    if (
        "/chat" in request.url.path
        and response.status_code == 200
        and hasattr(request.state, "user")
        and request.state.user
    ):
        try:
            user = request.state.user
            from src.services.usage_service import get_usage_service

            usage_service = get_usage_service()

            if usage_service:
                # Increment message count
                await usage_service.increment_usage(
                    user_id=user.user_id,
                    message_count=1,
                    tokens_used=0,  # Could be extracted from response metadata
                )

                logger.debug(f"Tracked usage for user {user.user_id}")

        except Exception as e:
            logger.error(f"Usage tracking failed: {e}")
            # Don't fail the request if tracking fails

    return response
