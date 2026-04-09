"""Aggregate payload for GET /v1/app/config (mobile remote config + updates)."""

from __future__ import annotations

from src.changelog_data import get_changelog
from src.feature_flags import get_feature_flags
from src.settings import (
    get_backend_version,
    get_force_update,
    get_latest_app_version,
    get_min_app_version,
    get_store_url_android,
    get_store_url_ios,
    get_update_message,
)


def build_app_config() -> dict:
    flags = get_feature_flags()
    return {
        "server_version": get_backend_version(),
        "min_supported_app_version": get_min_app_version(),
        "latest_app_version": get_latest_app_version(),
        "force_update": get_force_update(),
        "update_message": get_update_message(),
        "store_url_android": get_store_url_android() or None,
        "store_url_ios": get_store_url_ios() or None,
        "changelog": get_changelog(),
        "features": {
            "voice_transcription": flags.voice_transcription,
            "gpt4_model": flags.gpt4_model,
            "premium_ui": flags.premium_ui,
        },
    }
