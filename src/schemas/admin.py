"""Pydantic schemas for admin panel."""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional


class AdminUserResponse(BaseModel):
    """User information for admin view."""

    user_id: str
    email: str
    username: str
    plan: str
    is_active: bool
    created_at: str
    usage_today: int


class AdminUsersListResponse(BaseModel):
    """List of users for admin."""

    users: list[AdminUserResponse]
    total: int
    page: int
    per_page: int


class AdminUsageResponse(BaseModel):
    """Usage statistics for admin."""

    user_id: str
    date: str
    message_count: int
    tokens_used: int


class AdminDailyStatsResponse(BaseModel):
    """Daily aggregated statistics."""

    date: str
    total_messages: int
    total_users_active: int
    average_per_user: float
    premium_users_active: int


class AdminPaymentResponse(BaseModel):
    """Payment information for admin."""

    payment_id: str
    user_id: str
    amount_usd: float
    currency: str
    method: str
    status: str
    created_at: str
    plan: str


class AdminPaymentsListResponse(BaseModel):
    """List of payments for admin."""

    payments: list[AdminPaymentResponse]
    total: int
    total_revenue: float


class AdminSystemStatsResponse(BaseModel):
    """System-wide statistics."""

    total_users: int
    premium_users: int
    free_users: int
    active_users: int
    total_messages_today: int
    total_revenue_usd: float
    active_subscriptions: int


class AdminActionResponse(BaseModel):
    """Response to admin actions."""

    success: bool
    message: str
    user_id: Optional[str] = None


class AdminChangePlanRequest(BaseModel):
    """Request to change user's plan (admin)."""

    plan: str = Field(..., description="New plan: free, basic, pro, elite")
    reason: Optional[str] = None
