"""Server-side changelog for in-app “What’s new”. Override with CHANGELOG_JSON env."""

from __future__ import annotations

import json
import os
from functools import lru_cache


DEFAULT_CHANGELOG: list[dict] = [
    {
        "version": "1.0.0",
        "date": "2026-04-01",
        "notes": ["Initial Nova Mind AI API", "Versioned routes /v1 and /v2", "Feature flags & app config endpoint"],
    }
]


@lru_cache
def get_changelog() -> list[dict]:
    raw = (os.getenv("CHANGELOG_JSON") or "").strip()
    if not raw:
        return list(DEFAULT_CHANGELOG)
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass
    return list(DEFAULT_CHANGELOG)
