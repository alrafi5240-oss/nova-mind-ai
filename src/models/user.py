"""User model for SaaS system."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from typing import Optional


class UserPlan(str, Enum):
    """User subscription plan types."""

    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ELITE = "elite"


@dataclass
class User:
    """User model for SaaS platform."""

    # Core identifiers
    user_id: str  # UUID format
    email: str
    username: str
    api_key: str  # Unique, auto-generated

    # Plan & account status
    plan: UserPlan = UserPlan.FREE
    is_active: bool = True

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = asdict(self)
        data["plan"] = self.plan.value
        data["created_at"] = self.created_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data

    @staticmethod
    def from_dict(data: dict) -> User:
        """Create from dictionary."""
        data = data.copy()
        data["plan"] = UserPlan(data.get("plan", "free"))
        if isinstance(data.get("created_at"), str):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if isinstance(data.get("updated_at"), str):
            data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        return User(**data)

    def update(self, **kwargs) -> None:
        """Update user fields."""
        for key, value in kwargs.items():
            if key == "plan" and isinstance(value, str):
                setattr(self, key, UserPlan(value))
            elif key in ("created_at", "updated_at") and isinstance(value, str):
                setattr(self, key, datetime.fromisoformat(value))
            elif hasattr(self, key):
                setattr(self, key, value)

        self.updated_at = datetime.utcnow()

    @property
    def daily_message_limit(self) -> int:
        """Get daily message limit for user's plan."""
        limits = {
            UserPlan.FREE: 10,
            UserPlan.BASIC: 500,
            UserPlan.PRO: 5000,
            UserPlan.ELITE: -1,  # Unlimited
        }
        return limits.get(self.plan, 10)

    @property
    def is_premium(self) -> bool:
        """Check if user has premium plan."""
        return self.plan in (UserPlan.BASIC, UserPlan.PRO, UserPlan.ELITE)
