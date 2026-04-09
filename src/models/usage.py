"""Usage tracking model for SaaS system."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, date


@dataclass
class DailyUsage:
    """Daily usage tracking for users."""

    # Core identifiers
    usage_id: str  # UUID format
    user_id: str

    # Date tracking
    date: date  # The date for which usage is tracked

    # Usage metrics
    message_count: int = 0
    tokens_used: int = 0

    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    # Metadata
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = asdict(self)
        data["date"] = self.date.isoformat()
        data["created_at"] = self.created_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data

    @staticmethod
    def from_dict(data: dict) -> DailyUsage:
        """Create from dictionary."""
        data = data.copy()
        if isinstance(data.get("date"), str):
            data["date"] = date.fromisoformat(data["date"])
        if isinstance(data.get("created_at"), str):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if isinstance(data.get("updated_at"), str):
            data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        return DailyUsage(**data)

    def update(self, **kwargs) -> None:
        """Update usage fields."""
        for key, value in kwargs.items():
            if key == "date" and isinstance(value, str):
                setattr(self, key, date.fromisoformat(value))
            elif key in ("created_at", "updated_at") and isinstance(value, str):
                setattr(self, key, datetime.fromisoformat(value))
            elif hasattr(self, key):
                setattr(self, key, value)

        self.updated_at = datetime.utcnow()

    def increment_messages(self, count: int = 1) -> None:
        """Increment message count."""
        self.message_count += count
        self.updated_at = datetime.utcnow()

    def increment_tokens(self, count: int) -> None:
        """Increment token usage."""
        self.tokens_used += count
        self.updated_at = datetime.utcnow()

    @property
    def total_api_calls(self) -> int:
        """Get total API calls (equivalent to message count)."""
        return self.message_count

    def reset(self) -> None:
        """Reset daily usage counters."""
        self.message_count = 0
        self.tokens_used = 0
        self.updated_at = datetime.utcnow()
