"""Payment model for SaaS system."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum


class PaymentMethod(str, Enum):
    """Payment method types."""

    STRIPE = "stripe"
    BKASH = "bkash"
    NAGAD = "nagad"
    CRYPTO = "crypto"  # ETH/BTC


class PaymentStatus(str, Enum):
    """Payment status types."""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


@dataclass
class Payment:
    """Payment transaction model."""

    # Core identifiers
    payment_id: str  # UUID format
    user_id: str

    # Payment details
    amount_usd: float
    currency: str = "USD"  # USD, BDT, ETH, BTC
    method: PaymentMethod = PaymentMethod.STRIPE
    status: PaymentStatus = PaymentStatus.PENDING

    # Transaction tracking
    transaction_id: str = ""  # Provider's transaction ID
    reference_id: str = ""  # Internal reference

    # Dates
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: datetime = field(default=None)

    # Metadata
    plan: str = ""  # What plan is being purchased
    description: str = ""
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = asdict(self)
        data["method"] = self.method.value
        data["status"] = self.status.value
        data["created_at"] = self.created_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        if self.completed_at:
            data["completed_at"] = self.completed_at.isoformat()
        return data

    @staticmethod
    def from_dict(data: dict) -> Payment:
        """Create from dictionary."""
        data = data.copy()
        data["method"] = PaymentMethod(data.get("method", "stripe"))
        data["status"] = PaymentStatus(data.get("status", "pending"))
        if isinstance(data.get("created_at"), str):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if isinstance(data.get("updated_at"), str):
            data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        if data.get("completed_at") and isinstance(data["completed_at"], str):
            data["completed_at"] = datetime.fromisoformat(data["completed_at"])
        return Payment(**data)

    def update(self, **kwargs) -> None:
        """Update payment fields."""
        for key, value in kwargs.items():
            if key == "method" and isinstance(value, str):
                setattr(self, key, PaymentMethod(value))
            elif key == "status" and isinstance(value, str):
                setattr(self, key, PaymentStatus(value))
            elif key in ("created_at", "updated_at", "completed_at") and isinstance(value, str):
                setattr(self, key, datetime.fromisoformat(value))
            elif hasattr(self, key):
                setattr(self, key, value)

        self.updated_at = datetime.utcnow()

    @property
    def is_successful(self) -> bool:
        """Check if payment was successful."""
        return self.status == PaymentStatus.COMPLETED

    @property
    def is_failed(self) -> bool:
        """Check if payment failed."""
        return self.status in (PaymentStatus.FAILED, PaymentStatus.REFUNDED)

    def mark_completed(self, transaction_id: str) -> None:
        """Mark payment as completed."""
        self.status = PaymentStatus.COMPLETED
        self.transaction_id = transaction_id
        self.completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def mark_failed(self, reason: str = "") -> None:
        """Mark payment as failed."""
        self.status = PaymentStatus.FAILED
        self.metadata["failure_reason"] = reason
        self.updated_at = datetime.utcnow()
