"""Admin authentication middleware."""

from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


def get_admin_token() -> Optional[str]:
    """Get admin token from environment.

    Returns:
        Admin token or None if not configured
    """
    return os.getenv("ADMIN_TOKEN")


async def require_admin(request: Request) -> bool:
    """Dependency for admin endpoints - requires admin authentication.

    Args:
        request: FastAPI request object

    Returns:
        True if authenticated

    Raises:
        HTTPException: If not authenticated as admin
    """
    admin_token = get_admin_token()

    if not admin_token:
        logger.warning("Admin token not configured")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access not configured",
        )

    # Get token from header
    auth_header = request.headers.get("X-Admin-Token", "")

    if not auth_header or auth_header != admin_token:
        client_ip = request.client.host if request.client else "unknown"
        logger.warning(f"Unauthorized admin attempt from {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token",
        )

    logger.info(f"Admin access granted from {request.client.host if request.client else 'unknown'}")
    return True


class AdminAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to require admin token for /admin/* endpoints."""

    async def dispatch(self, request: Request, call_next):
        """Process request and check admin auth.

        Args:
            request: FastAPI request
            call_next: Next middleware/endpoint

        Returns:
            Response
        """
        # Only check on admin endpoints
        if request.url.path.startswith("/admin"):
            try:
                await require_admin(request)
            except HTTPException as e:
                return JSONResponse(
                    status_code=e.status_code,
                    content={"error": "unauthorized", "detail": e.detail},
                )

        response = await call_next(request)
        return response
