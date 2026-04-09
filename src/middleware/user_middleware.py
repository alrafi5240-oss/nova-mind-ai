"""User authentication middleware for SaaS system."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import Request, HTTPException, status

from src.models.user import User
from src.services.auth_service import AuthService

logger = logging.getLogger(__name__)

# Global auth service instance (set during app startup)
_auth_service: Optional[AuthService] = None


def set_auth_service(auth_service: AuthService) -> None:
    """Set the global auth service instance.

    Args:
        auth_service: AuthService instance to use
    """
    global _auth_service
    _auth_service = auth_service


def get_auth_service() -> Optional[AuthService]:
    """Get the global auth service instance.

    Returns:
        AuthService instance or None if not set
    """
    return _auth_service


async def extract_user_from_request(request: Request) -> Optional[User]:
    """Extract and authenticate user from request headers.

    Supports authentication via:
    1. X-API-Key header
    2. Authorization: Bearer {api_key} header

    Args:
        request: FastAPI request object

    Returns:
        User object if authenticated, None otherwise
    """
    try:
        auth_service = get_auth_service()
        if not auth_service:
            logger.warning("Auth service not initialized")
            return None

        # Check for X-API-Key header
        api_key = request.headers.get("X-API-Key")

        # Check for Authorization header (Bearer token)
        if not api_key:
            auth_header = request.headers.get("Authorization")
            if auth_header:
                api_key = AuthService.extract_api_key_from_header(auth_header)

        if not api_key:
            return None

        # Validate API key
        is_valid, user = await auth_service.validate_api_key(api_key)

        if is_valid and user:
            logger.debug(f"Authenticated user: {user.user_id}")
            return user

        logger.debug(f"Authentication failed for API key")
        return None

    except Exception as e:
        logger.error(f"User extraction failed: {e}")
        return None


async def require_user(request: Request) -> User:
    """Dependency for protected endpoints - requires user authentication.

    Args:
        request: FastAPI request object

    Returns:
        Authenticated User object

    Raises:
        HTTPException: If user is not authenticated
    """
    user = await extract_user_from_request(request)

    if not user:
        logger.warning(f"Unauthorized request from {request.client.host if request.client else 'unknown'}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def optional_user(request: Request) -> Optional[User]:
    """Dependency for optional user authentication.

    Args:
        request: FastAPI request object

    Returns:
        Authenticated User object or None
    """
    return await extract_user_from_request(request)


# Middleware class for logging user context
class UserContextMiddleware:
    """Middleware to add user context to request state."""

    def __init__(self):
        """Initialize middleware."""
        pass

    async def __call__(self, request: Request, call_next):
        """Process request and add user to state.

        Args:
            request: FastAPI request
            call_next: Next middleware/endpoint

        Returns:
            Response
        """
        try:
            user = await extract_user_from_request(request)
            request.state.user = user
            request.state.user_id = user.user_id if user else None

            # Log request with user context
            if user:
                logger.debug(f"Request from user {user.user_id}: {request.method} {request.url.path}")

        except Exception as e:
            logger.error(f"User context middleware error: {e}")
            request.state.user = None
            request.state.user_id = None

        response = await call_next(request)
        return response
