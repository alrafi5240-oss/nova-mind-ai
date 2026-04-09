"""User management endpoints for SaaS system."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import EmailStr

from src.models.user import User
from src.middleware.user_middleware import require_user
from src.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    RegisterResponse,
    UserProfileResponse,
    UserDetailResponse,
    AuthResponse,
    ChangePlanRequest,
    UserApiKeyResponse,
)
from src.services.user_service import UserService
from src.services.auth_service import AuthService
from src.deps import get_user_service, get_auth_service
from src.services.usage_service import get_usage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"description": "Validation error or user already exists"},
        500: {"description": "Server error"},
    },
)
async def register(
    request: UserRegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new user.

    Args:
        request: Registration request with email, username, password
        auth_service: AuthService dependency

    Returns:
        RegisterResponse with user details and API key
    """
    success, user, message = await auth_service.register(
        email=request.email,
        username=request.username,
        password=request.password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

    logger.info(f"User registered: {user.user_id}")

    return RegisterResponse(
        user_id=user.user_id,
        email=user.email,
        username=user.username,
        api_key=user.api_key,
        message=message,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={
        401: {"description": "Invalid credentials"},
        403: {"description": "Account suspended"},
    },
)
async def login(
    request: UserLoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Authenticate user and get API key.

    Args:
        request: Login request with email/username and password
        auth_service: AuthService dependency

    Returns:
        AuthResponse with user_id and API key
    """
    success, user, message = await auth_service.login(
        email_or_username=request.email_or_username,
        password=request.password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
        )

    logger.info(f"User logged in: {user.user_id}")

    return AuthResponse(
        success=True,
        message=message,
        user_id=user.user_id,
        api_key=user.api_key,
    )


@router.get(
    "/profile",
    response_model=UserDetailResponse,
    responses={
        401: {"description": "Unauthorized"},
    },
)
async def get_profile(
    user: User = Depends(require_user),
    user_service: UserService = Depends(get_user_service),
):
    """Get current user's profile.

    Args:
        user: Authenticated user from dependency
        user_service: UserService dependency

    Returns:
        UserDetailResponse with user profile and usage info
    """
    profile = UserProfileResponse(
        user_id=user.user_id,
        email=user.email,
        username=user.username,
        plan=user.plan.value,
        is_active=user.is_active,
        daily_message_limit=user.daily_message_limit,
        is_premium=user.is_premium,
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat(),
        metadata=user.metadata,
    )

    # Get usage info
    usage_service = get_usage_service()
    usage_today = 0
    if usage_service:
        usage_today = await usage_service.get_today_usage(user.user_id)

    return UserDetailResponse(
        user=profile,
        usage_today=usage_today,
        usage_limit=user.daily_message_limit,
    )


@router.post(
    "/rotate-key",
    response_model=UserApiKeyResponse,
    responses={
        401: {"description": "Unauthorized"},
    },
)
async def rotate_api_key(
    user: User = Depends(require_user),
    user_service: UserService = Depends(get_user_service),
):
    """Generate a new API key for current user.

    Args:
        user: Authenticated user from dependency
        user_service: UserService dependency

    Returns:
        UserApiKeyResponse with new API key
    """
    new_api_key = await user_service.rotate_api_key(user)

    if not new_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rotate API key",
        )

    logger.info(f"API key rotated for user: {user.user_id}")

    return UserApiKeyResponse(
        user_id=user.user_id,
        api_key=new_api_key,
        message="New API key generated. The old key is no longer valid.",
    )


@router.post(
    "/change-plan",
    response_model=AuthResponse,
    responses={
        400: {"description": "Invalid plan"},
        401: {"description": "Unauthorized"},
    },
)
async def change_plan(
    request: ChangePlanRequest,
    user: User = Depends(require_user),
    user_service: UserService = Depends(get_user_service),
):
    """Change user's subscription plan.

    Note: In production, this would be restricted to admin or require payment.

    Args:
        request: ChangePlanRequest with new plan
        user: Authenticated user
        user_service: UserService dependency

    Returns:
        AuthResponse indicating success
    """
    # Validate plan
    try:
        from src.models.user import UserPlan

        UserPlan(request.plan)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan: {request.plan}. Must be free, basic, pro, or elite.",
        )

    success = await user_service.change_plan(user, request.plan)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change plan",
        )

    logger.info(f"User {user.user_id} changed plan to {request.plan}")

    return AuthResponse(
        success=True,
        message=f"Plan changed to {request.plan}",
        user_id=user.user_id,
    )
