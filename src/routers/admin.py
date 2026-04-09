"""Admin panel endpoints for SaaS system."""

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query

from src.middleware.admin_auth import require_admin
from src.schemas.admin import (
    AdminUsersListResponse,
    AdminUserResponse,
    AdminUsageResponse,
    AdminPaymentResponse,
    AdminPaymentsListResponse,
    AdminSystemStatsResponse,
    AdminActionResponse,
    AdminChangePlanRequest,
)
from src.services.user_service import UserService
from src.services.usage_service import UsageService
from src.services.subscription_service import SubscriptionService
from src.services.payment_service import PaymentService
from src.deps import get_user_service, get_usage_service, get_subscription_service, get_payment_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


# ============================================================================
# User Management
# ============================================================================


@router.get(
    "/users",
    response_model=AdminUsersListResponse,
    responses={401: {"description": "Unauthorized"}},
)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _: bool = Depends(require_admin),
    user_service: UserService = Depends(get_user_service),
    usage_service: Optional[UsageService] = Depends(get_usage_service),
):
    """List all users with pagination.

    Args:
        page: Page number
        per_page: Items per page
        _: Admin authentication
        user_service: UserService dependency
        usage_service: UsageService dependency

    Returns:
        AdminUsersListResponse with user list
    """
    limit = per_page
    offset = (page - 1) * per_page

    users, total = await user_service.list_users(limit=limit, offset=offset)

    admin_users = []
    for user in users:
        usage_today = 0
        if usage_service:
            usage_today = await usage_service.get_today_usage(user.user_id)

        admin_users.append(
            AdminUserResponse(
                user_id=user.user_id,
                email=user.email,
                username=user.username,
                plan=user.plan.value,
                is_active=user.is_active,
                created_at=user.created_at.isoformat(),
                usage_today=usage_today,
            )
        )

    return AdminUsersListResponse(
        users=admin_users,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/users/{user_id}", responses={401: {"description": "Unauthorized"}})
async def get_user(
    user_id: str,
    _: bool = Depends(require_admin),
    user_service: UserService = Depends(get_user_service),
    usage_service: Optional[UsageService] = Depends(get_usage_service),
):
    """Get user details.

    Args:
        user_id: User ID
        _: Admin authentication
        user_service: UserService dependency
        usage_service: UsageService dependency

    Returns:
        User details with usage info
    """
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    usage_today = 0
    if usage_service:
        usage_today = await usage_service.get_today_usage(user_id)

    return {
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "username": user.username,
            "plan": user.plan.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        },
        "usage_today": usage_today,
        "usage_limit": user.daily_message_limit,
    }


@router.put("/users/{user_id}/plan", response_model=AdminActionResponse)
async def change_user_plan(
    user_id: str,
    request: AdminChangePlanRequest,
    _: bool = Depends(require_admin),
    user_service: UserService = Depends(get_user_service),
):
    """Change user's subscription plan.

    Args:
        user_id: User ID
        request: Plan change request
        _: Admin authentication
        user_service: UserService dependency

    Returns:
        AdminActionResponse indicating success
    """
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    success = await user_service.change_plan(user, request.plan)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to change plan")

    logger.info(f"Admin changed user {user_id} plan to {request.plan}")

    return AdminActionResponse(
        success=True,
        message=f"Plan changed to {request.plan}",
        user_id=user_id,
    )


@router.post("/users/{user_id}/activate", response_model=AdminActionResponse)
async def activate_user(
    user_id: str,
    _: bool = Depends(require_admin),
    user_service: UserService = Depends(get_user_service),
):
    """Activate a user account.

    Args:
        user_id: User ID
        _: Admin authentication
        user_service: UserService dependency

    Returns:
        AdminActionResponse
    """
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    success = await user_service.activate_user(user)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to activate user")

    logger.info(f"Admin activated user {user_id}")

    return AdminActionResponse(
        success=True,
        message="User activated",
        user_id=user_id,
    )


@router.post("/users/{user_id}/suspend", response_model=AdminActionResponse)
async def suspend_user(
    user_id: str,
    _: bool = Depends(require_admin),
    user_service: UserService = Depends(get_user_service),
):
    """Suspend a user account.

    Args:
        user_id: User ID
        _: Admin authentication
        user_service: UserService dependency

    Returns:
        AdminActionResponse
    """
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    success = await user_service.suspend_user(user)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to suspend user")

    logger.info(f"Admin suspended user {user_id}")

    return AdminActionResponse(
        success=True,
        message="User suspended",
        user_id=user_id,
    )


@router.delete("/users/{user_id}", response_model=AdminActionResponse)
async def delete_user(
    user_id: str,
    _: bool = Depends(require_admin),
    user_service: UserService = Depends(get_user_service),
):
    """Delete (soft delete) a user account.

    Args:
        user_id: User ID
        _: Admin authentication
        user_service: UserService dependency

    Returns:
        AdminActionResponse
    """
    success = await user_service.delete_user(user_id)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete user")

    logger.info(f"Admin deleted user {user_id}")

    return AdminActionResponse(
        success=True,
        message="User deleted",
        user_id=user_id,
    )


# ============================================================================
# Usage Tracking
# ============================================================================


@router.get("/usage", responses={401: {"description": "Unauthorized"}})
async def get_system_usage(
    target_date: Optional[str] = None,
    _: bool = Depends(require_admin),
    usage_service: Optional[UsageService] = Depends(get_usage_service),
):
    """Get system-wide usage statistics for a date.

    Args:
        target_date: Date in YYYY-MM-DD format (default: today)
        _: Admin authentication
        usage_service: UsageService dependency

    Returns:
        Dict with usage statistics
    """
    if not usage_service:
        raise HTTPException(status_code=503, detail="Usage service not available")

    if not target_date:
        target_date = str(date.today())

    # Get all usage for the date (would require iterating users)
    # For now, return a summary message
    return {
        "date": target_date,
        "message": "Use /admin/usage/{user_id} for specific user usage",
    }


@router.get("/usage/{user_id}", responses={401: {"description": "Unauthorized"}})
async def get_user_usage(
    user_id: str,
    days: int = Query(7, ge=1, le=365),
    _: bool = Depends(require_admin),
    usage_service: Optional[UsageService] = Depends(get_usage_service),
):
    """Get usage statistics for a specific user.

    Args:
        user_id: User ID
        days: Number of days to show (default: 7)
        _: Admin authentication
        usage_service: UsageService dependency

    Returns:
        List of usage records
    """
    if not usage_service:
        raise HTTPException(status_code=503, detail="Usage service not available")

    start_date = date.today() - timedelta(days=days - 1)
    end_date = date.today()

    usages = await usage_service.get_usage_range(user_id, start_date, end_date)

    return {
        "user_id": user_id,
        "days": days,
        "usage": [
            AdminUsageResponse(
                user_id=u.user_id,
                date=u.date.isoformat(),
                message_count=u.message_count,
                tokens_used=u.tokens_used,
            ).dict()
            for u in usages
        ],
    }


# ============================================================================
# Payments & Billing
# ============================================================================


@router.get("/payments", response_model=AdminPaymentsListResponse)
async def list_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    _: bool = Depends(require_admin),
    payment_service: Optional[PaymentService] = Depends(get_payment_service),
):
    """List all payments.

    Args:
        page: Page number
        per_page: Items per page
        status: Filter by status (pending, completed, failed, refunded)
        _: Admin authentication
        payment_service: PaymentService dependency

    Returns:
        AdminPaymentsListResponse with payment list
    """
    if not payment_service:
        raise HTTPException(status_code=503, detail="Payment service not available")

    # Get all payments (simplified for structure)
    all_payments = await payment_service.storage.list(prefix="payments:id:")

    # Filter by status if provided
    if status:
        all_payments = [p for p in all_payments if p.get("status") == status]

    # Paginate
    offset = (page - 1) * per_page
    paginated = all_payments[offset : offset + per_page]

    admin_payments = [
        AdminPaymentResponse(
            payment_id=p.get("payment_id", ""),
            user_id=p.get("user_id", ""),
            amount_usd=p.get("amount_usd", 0),
            currency=p.get("currency", "USD"),
            method=p.get("method", ""),
            status=p.get("status", ""),
            created_at=p.get("created_at", ""),
            plan=p.get("plan", ""),
        )
        for p in paginated
    ]

    total_revenue = sum(p.amount_usd for p in paginated if p.get("status") == "completed")

    return AdminPaymentsListResponse(
        payments=admin_payments,
        total=len(all_payments),
        total_revenue=total_revenue,
    )


# ============================================================================
# System Statistics
# ============================================================================


@router.get("/stats", response_model=AdminSystemStatsResponse)
async def get_system_stats(
    _: bool = Depends(require_admin),
    user_service: UserService = Depends(get_user_service),
    subscription_service: Optional[SubscriptionService] = Depends(get_subscription_service),
    payment_service: Optional[PaymentService] = Depends(get_payment_service),
):
    """Get system-wide statistics.

    Args:
        _: Admin authentication
        user_service: UserService dependency
        subscription_service: SubscriptionService dependency
        payment_service: PaymentService dependency

    Returns:
        AdminSystemStatsResponse with system stats
    """
    user_stats = await user_service.get_stats()

    total_revenue = 0.0
    if payment_service:
        payments = await payment_service.storage.list(prefix="payments:id:")
        total_revenue = sum(p.get("amount_usd", 0) for p in payments if p.get("status") == "completed")

    sub_stats = {}
    if subscription_service:
        sub_stats = await subscription_service.get_stats()

    return AdminSystemStatsResponse(
        total_users=user_stats.get("total_users", 0),
        premium_users=user_stats.get("premium_users", 0),
        free_users=user_stats.get("free_users", 0),
        active_users=user_stats.get("active_users", 0),
        total_messages_today=0,  # Would sum all usage records
        total_revenue_usd=total_revenue,
        active_subscriptions=sub_stats.get("active_subscriptions", 0),
    )
