"""Request logging for usage and error triage (extend with OpenTelemetry later)."""

from __future__ import annotations

import logging
import time
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("nova.request")


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        path = request.url.path
        method = request.method
        try:
            response = await call_next(request)
            ms = (time.perf_counter() - start) * 1000
            logger.info(
                "%s %s -> %s in %.1fms",
                method,
                path,
                response.status_code,
                ms,
            )
            return response
        except Exception:
            ms = (time.perf_counter() - start) * 1000
            logger.exception("%s %s failed after %.1fms", method, path, ms)
            raise
