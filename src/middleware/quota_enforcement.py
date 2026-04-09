"""Middleware for enforcing subscription quotas."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import Request, HTTPException, status

from src.models.user import User
from src.services.usage_service import UsageService

logger = logging.getLogger(__name__)


async def check_message_quota(
    user: User,
    usage_service: Optional[UsageService] = None,
) -> tuple[bool, str]:
    """Check if user has remaining message quota for today.

    Args:
        user: User object
        usage_service: UsageService instance

    Returns:
        Tuple of (quota_available, message)
    """
    try:
        if not usage_service:
            logger.warning("Usage service not available for quota check")
            # Allow request if service is down (graceful degradation)
            return True, "Usage service unavailable"

        # Get today's usage
        today_usage = await usage_service.get_today_usage(user.user_id)

        # Get user's limit
        limit = user.daily_message_limit

        # Elite plan has unlimited messages (-1)
        if limit == -1:
            return True, "Elite plan - unlimited"

        # Check if limit reached
        if today_usage >= limit:
            logger.warning(
                f"User {user.user_id} hit quota limit ({limit}): {today_usage}/{limit}"
            )
            return False, f"Daily limit reached ({limit} messages). Upgrade your plan or try again tomorrow."

        remaining = limit - today_usage
        logger.debug(f"User {user.user_id} has {remaining}/{limit} messages remaining")
        return True, f"{remaining} messages remaining"

    except Exception as e:
        logger.error(f"Quota check failed: {e}")
        # Allow request if check fails (graceful degradation)
        return True, "Quota check error"


async def enforce_quota_middleware(request: Request, call_next):
    """Middleware to enforce message quotas on chat endpoints.

    Args:
        request: FastAPI request
        call_next: Next middleware/endpoint

    Returns:
        Response or HTTP 429 if quota exceeded
    """
    # Only enforce on chat endpoints
    if "/chat" not in request.url.path:
        return await call_next(request)

    try:
        user = getattr(request.state, "user", None)

        if not user:
            # No user authenticated, let endpoint handle authentication
            return await call_next(request)

        # Get usage service
        from src.services.usage_service import get_usage_service

        usage_service = get_usage_service()

        # Check quota
        has_quota, message = await check_message_quota(user, usage_service)

        if not has_quota:
            logger.warning(f"Quota exceeded for user {user.user_id}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=message,
                headers={
                    "Retry-After": "86400",  # 24 hours in seconds
                    "X-RateLimit-Limit": str(user.daily_message_limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": "tomorrow",
                },
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quota enforcement middleware error: {e}")
        # Allow request on error (graceful degradation)

    return await call_next(request)


async def require_quota(user: User, usage_service: Optional[UsageService] = None) -> None:
    """Dependency for endpoints requiring available quota.

    Args:
        user: Authenticated user
        usage_service: UsageService instance

    Raises:
        HTTPException: If quota exceeded
    """
    has_quota, message = await check_message_quota(user, usage_service)

    if not has_quota:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=message,
            headers={
                "Retry-After": "86400",
                "X-RateLimit-Limit": str(user.daily_message_limit),
                "X-RateLimit-Remaining": "0",
            },
        )
