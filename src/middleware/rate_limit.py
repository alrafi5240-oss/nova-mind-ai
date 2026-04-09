"""Rate limiting middleware for API protection."""

import logging
import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

# Rate limiting configuration
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 60  # requests per window

# In-memory storage: {ip: [(timestamp, count)]}
_rate_limit_store = defaultdict(list)


def get_client_ip(request: Request) -> str:
    """Extract client IP from request.

    Args:
        request: FastAPI request object

    Returns:
        Client IP address
    """
    # Check for X-Forwarded-For header (behind proxy)
    if request.headers.get("x-forwarded-for"):
        return request.headers["x-forwarded-for"].split(",")[0].strip()

    # Check for X-Real-IP header
    if request.headers.get("x-real-ip"):
        return request.headers["x-real-ip"]

    # Fall back to client connection IP
    return request.client.host if request.client else "unknown"


def check_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded rate limit.

    Args:
        client_ip: Client IP address

    Returns:
        True if within limit, False if exceeded
    """
    current_time = time.time()
    window_start = current_time - RATE_LIMIT_WINDOW

    # Clean old entries
    _rate_limit_store[client_ip] = [
        timestamp for timestamp in _rate_limit_store[client_ip]
        if timestamp > window_start
    ]

    # Check limit
    request_count = len(_rate_limit_store[client_ip])
    if request_count >= RATE_LIMIT_MAX_REQUESTS:
        return False

    # Add current request
    _rate_limit_store[client_ip].append(current_time)
    return True


async def rate_limit_middleware(request: Request, call_next: Callable):
    """Rate limiting middleware for all requests.

    Args:
        request: HTTP request
        call_next: Next middleware/handler

    Returns:
        Response from next handler or 429 Too Many Requests

    Raises:
        HTTPException: If rate limit exceeded
    """
    # Skip rate limiting for health checks
    if request.url.path == "/v1/health":
        return await call_next(request)

    client_ip = get_client_ip(request)

    if not check_rate_limit(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )

    response = await call_next(request)

    # Add rate limit headers to response
    request_count = len(_rate_limit_store[client_ip])
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
    response.headers["X-RateLimit-Remaining"] = str(
        max(0, RATE_LIMIT_MAX_REQUESTS - request_count)
    )
    response.headers["X-RateLimit-Reset"] = str(
        int(time.time() + RATE_LIMIT_WINDOW)
    )

    return response
