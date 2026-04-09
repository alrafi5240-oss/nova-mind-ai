"""Pydantic schemas for user endpoints."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")


class UserLoginRequest(BaseModel):
    """User login request."""

    email_or_username: str = Field(..., description="Email or username")
    password: str = Field(..., description="Password")


class UserProfileResponse(BaseModel):
    """User profile response."""

    user_id: str
    email: str
    username: str
    plan: str
    is_active: bool
    daily_message_limit: int
    is_premium: bool
    created_at: str
    updated_at: str
    metadata: dict = {}


class UserApiKeyResponse(BaseModel):
    """API key response (shown only at creation)."""

    user_id: str
    api_key: str
    message: str = "Keep this API key safe. You won't be able to see it again."


class UserListResponse(BaseModel):
    """List of users response."""

    users: list[UserProfileResponse]
    total: int
    page: int
    per_page: int


class UserDetailResponse(BaseModel):
    """Detailed user information."""

    user: UserProfileResponse
    subscription: Optional[dict] = None
    usage_today: int = 0
    usage_limit: int = 10


class ChangePlanRequest(BaseModel):
    """Request to change user plan."""

    plan: str = Field(..., description="New plan: free, basic, pro, elite")


class RegisterResponse(BaseModel):
    """Registration response."""

    user_id: str
    email: str
    username: str
    api_key: str
    message: str


class AuthResponse(BaseModel):
    """Generic auth response."""

    success: bool
    message: str
    user_id: Optional[str] = None
    api_key: Optional[str] = None
