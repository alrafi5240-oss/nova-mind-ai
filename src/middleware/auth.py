"""Authentication middleware for API protection."""

import logging
import os
from typing import Optional

from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

# Load API key from environment
API_KEY = os.getenv("API_KEY")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() in ("true", "1", "yes")


def extract_api_key(request: Request) -> Optional[str]:
    """Extract API key from request headers.

    Args:
        request: HTTP request

    Returns:
        API key or None
    """
    # Check Authorization header (Bearer token)
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()

    # Check X-API-Key header
    return request.headers.get("x-api-key")


async def auth_middleware(request: Request, call_next):
    """Authentication middleware for protected endpoints.

    Args:
        request: HTTP request
        call_next: Next middleware/handler

    Returns:
        Response from next handler or 401 Unauthorized

    Raises:
        HTTPException: If authentication required but not provided
    """
    # Skip auth for health check
    if request.url.path == "/v1/health":
        return await call_next(request)

    # Skip auth if not required
    if not REQUIRE_AUTH or not API_KEY:
        return await call_next(request)

    # Extract API key from request
    provided_key = extract_api_key(request)

    if not provided_key:
        logger.warning(f"Missing API key: {request.url.path}")
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Provide via 'Authorization: Bearer <key>' or 'X-API-Key: <key>' header."
        )

    if provided_key != API_KEY:
        logger.warning(f"Invalid API key: {request.url.path}")
        raise HTTPException(
            status_code=401,
            detail="Invalid API key."
        )

    logger.debug(f"API key validated for: {request.url.path}")
    response = await call_next(request)
    return response
