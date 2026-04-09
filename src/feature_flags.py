"""Remote-tunable feature flags (override via env; later: DB or LaunchDarkly)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _env_bool(key: str, default: bool) -> bool:
    raw = (os.getenv(key) or "").strip().lower()
    if raw in ("",):
        return default
    return raw in ("1", "true", "yes", "on")


@dataclass(frozen=True)
class FeatureFlags:
    voice_transcription: bool
    gpt4_model: bool
    premium_ui: bool
    llm_provider: str  # "openai" or "lite"


@lru_cache
def get_feature_flags() -> FeatureFlags:
    provider = (os.getenv("LLM_PROVIDER", "openai") or "openai").strip().lower()
    # Validate provider
    if provider not in ("openai", "lite"):
        provider = "openai"

    return FeatureFlags(
        voice_transcription=_env_bool("FEATURE_VOICE", True),
        gpt4_model=_env_bool("FEATURE_GPT4_MODEL", False),
        premium_ui=_env_bool("FEATURE_PREMIUM_UI", True),
        llm_provider=provider,
    )


def invalidate_flags_cache() -> None:
    get_feature_flags.cache_clear()
