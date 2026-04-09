"""SQLAlchemy ORM models for NOVA MIND AI database."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, UUID, ForeignKey,
    UniqueConstraint, Index, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    """User account model."""

    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, unique=True, index=True)
    username = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    api_key = Column(String(32), nullable=False, unique=True, index=True)
    plan = Column(String(50), nullable=False, default="free", index=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    metadata_ = Column(JSONB(astext_type=Text()), nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    usage_records = relationship("DailyUsage", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_user_email", "email"),
        Index("ix_user_api_key", "api_key"),
        Index("ix_user_is_active", "is_active"),
        Index("ix_user_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<User(user_id={self.user_id}, email={self.email}, plan={self.plan})>"


class Subscription(Base):
    """Subscription plan model."""

    __tablename__ = "subscriptions"

    subscription_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)
    plan = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="active", index=True)
    monthly_message_limit = Column(Integer, nullable=False)
    price_usd = Column(Float, nullable=False, default=0.0)
    billing_period_days = Column(Integer, nullable=False, default=30)
    start_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=False, index=True)
    auto_renew = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True)
    metadata_ = Column(JSONB(astext_type=Text()), nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="subscriptions")
    payments = relationship("Payment", back_populates="subscription")

    __table_args__ = (
        UniqueConstraint("user_id", "is_active", name="uq_subscription_user_active"),
        Index("ix_subscription_created_at", "created_at"),
        Index("ix_subscription_status", "status"),
        Index("ix_subscription_end_date", "end_date"),
    )

    def __repr__(self) -> str:
        return f"<Subscription(subscription_id={self.subscription_id}, user_id={self.user_id}, plan={self.plan})>"


class Payment(Base):
    """Payment transaction model."""

    __tablename__ = "payments"

    payment_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)
    subscription_id = Column(String(36), ForeignKey("subscriptions.subscription_id"), nullable=True)
    amount_usd = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    method = Column(String(50), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending", index=True)
    plan = Column(String(50), nullable=False)
    transaction_id = Column(String(255), nullable=True, index=True)
    provider_data = Column(JSONB(astext_type=Text()), nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")

    __table_args__ = (
        Index("ix_payment_created_at", "created_at"),
        Index("ix_payment_status", "status"),
        Index("ix_payment_method", "method"),
        Index("ix_payment_transaction_id", "transaction_id"),
    )

    def __repr__(self) -> str:
        return f"<Payment(payment_id={self.payment_id}, amount={self.amount_usd}, status={self.status})>"


class Conversation(Base):
    """Conversation (chat session) model."""

    __tablename__ = "conversations"

    conversation_id = Column(String(255), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_archived = Column(Boolean, nullable=False, default=False)
    metadata_ = Column(JSONB(astext_type=Text()), nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_conversation_created_at", "created_at"),
        Index("ix_conversation_user_id", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<Conversation(conversation_id={self.conversation_id}, user_id={self.user_id}, title={self.title})>"


class Message(Base):
    """Message model (chat history)."""

    __tablename__ = "messages"

    message_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)
    conversation_id = Column(String(255), ForeignKey("conversations.conversation_id"), nullable=False, index=True)
    role = Column(String(50), nullable=False, index=True)
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=True, default=0)
    metadata_ = Column(JSONB(astext_type=Text()), nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="messages")
    conversation = relationship("Conversation", back_populates="messages")

    __table_args__ = (
        Index("ix_message_created_at", "created_at"),
        Index("ix_message_conversation_id", "conversation_id"),
        Index("ix_message_user_id", "user_id"),
        Index("ix_message_role", "role"),
    )

    def __repr__(self) -> str:
        return f"<Message(message_id={self.message_id}, role={self.role}, tokens={self.tokens_used})>"


class DailyUsage(Base):
    """Daily usage tracking model."""

    __tablename__ = "daily_usage"

    usage_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)
    message_count = Column(Integer, nullable=False, default=0)
    tokens_used = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="usage_records")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_usage_user_date"),
        Index("ix_daily_usage_created_at", "created_at"),
        Index("ix_daily_usage_user_id", "user_id"),
        Index("ix_daily_usage_date", "date"),
    )

    def __repr__(self) -> str:
        return f"<DailyUsage(user_id={self.user_id}, date={self.date}, messages={self.message_count})>"
