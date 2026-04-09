"""Subscription model for SaaS system."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum


class SubscriptionStatus(str, Enum):
    """Subscription status types."""

    ACTIVE = "active"
    PENDING = "pending"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


@dataclass
class Subscription:
    """User subscription model."""

    # Core identifiers
    subscription_id: str  # UUID format
    user_id: str

    # Plan details
    plan: str  # "free" | "basic" | "pro" | "elite"
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    monthly_message_limit: int = 10

    # Pricing
    price_usd: float = 0.0
    billing_period_days: int = 30

    # Dates
    start_date: datetime = field(default_factory=datetime.utcnow)
    end_date: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(days=30))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    # Metadata
    auto_renew: bool = True
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = asdict(self)
        data["status"] = self.status.value
        data["start_date"] = self.start_date.isoformat()
        data["end_date"] = self.end_date.isoformat()
        data["created_at"] = self.created_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data

    @staticmethod
    def from_dict(data: dict) -> Subscription:
        """Create from dictionary."""
        data = data.copy()
        data["status"] = SubscriptionStatus(data.get("status", "active"))
        if isinstance(data.get("start_date"), str):
            data["start_date"] = datetime.fromisoformat(data["start_date"])
        if isinstance(data.get("end_date"), str):
            data["end_date"] = datetime.fromisoformat(data["end_date"])
        if isinstance(data.get("created_at"), str):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if isinstance(data.get("updated_at"), str):
            data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        return Subscription(**data)

    def update(self, **kwargs) -> None:
        """Update subscription fields."""
        for key, value in kwargs.items():
            if key == "status" and isinstance(value, str):
                setattr(self, key, SubscriptionStatus(value))
            elif key in ("start_date", "end_date", "created_at", "updated_at") and isinstance(value, str):
                setattr(self, key, datetime.fromisoformat(value))
            elif hasattr(self, key):
                setattr(self, key, value)

        self.updated_at = datetime.utcnow()

    @property
    def is_active(self) -> bool:
        """Check if subscription is currently active."""
        return self.status == SubscriptionStatus.ACTIVE and datetime.utcnow() < self.end_date

    @property
    def days_remaining(self) -> int:
        """Get days remaining in subscription."""
        if not self.is_active:
            return 0
        remaining = self.end_date - datetime.utcnow()
        return max(0, remaining.days)

    @property
    def is_expiring_soon(self) -> bool:
        """Check if subscription expires within 7 days."""
        return 0 <= self.days_remaining <= 7
