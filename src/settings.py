"""Central environment-backed settings for API versioning and ops."""

from __future__ import annotations

import os
from functools import lru_cache


def _strip(s: str | None) -> str:
    return (s or "").strip()


@lru_cache
def get_backend_version() -> str:
    return _strip(os.getenv("BACKEND_VERSION", "1.0.0")) or "1.0.0"


def get_openai_model(api_version: str) -> str:
    """
    Map API surface version to model id. Upgrade v2 independently of v1
    (e.g. gpt-4.1-mini on v1, gpt-4o on v2) without breaking old clients.
    """
    v = (api_version or "v1").lower()
    if v == "v2":
        return _strip(os.getenv("OPENAI_MODEL_V2")) or _strip(os.getenv("OPENAI_MODEL")) or "gpt-4o"
    return _strip(os.getenv("OPENAI_MODEL")) or "gpt-4.1-mini"


def get_min_app_version() -> str:
    return _strip(os.getenv("APP_MIN_VERSION", "1.0.0")) or "1.0.0"


def get_latest_app_version() -> str:
    return _strip(os.getenv("APP_LATEST_VERSION", "1.0.0")) or "1.0.0"


def get_force_update() -> bool:
    return _strip(os.getenv("APP_FORCE_UPDATE", "false")).lower() in ("1", "true", "yes")


def get_store_url_android() -> str:
    return _strip(os.getenv("APP_STORE_URL_ANDROID"))


def get_store_url_ios() -> str:
    return _strip(os.getenv("APP_STORE_URL_IOS"))


def get_update_message() -> str:
    return _strip(os.getenv("APP_UPDATE_MESSAGE", "A new version is available with improvements and fixes."))
