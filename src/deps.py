"""Shared runtime dependencies (set from main during startup)."""

from __future__ import annotations

from typing import Callable, Optional

from openai import AsyncOpenAI

from src.services.user_service import UserService
from src.services.auth_service import AuthService
from src.services.usage_service import UsageService
from src.services.subscription_service import SubscriptionService
from src.services.payment_service import PaymentService

# OpenAI client
_get_client: Callable[[], AsyncOpenAI | None] | None = None
_has_api_key: bool = False

# SaaS services
_user_service: Optional[UserService] = None
_auth_service: Optional[AuthService] = None
_usage_service: Optional[UsageService] = None
_subscription_service: Optional[SubscriptionService] = None
_payment_service: Optional[PaymentService] = None


# ============================================================================
# OpenAI Client
# ============================================================================


def set_openai_client_getter(fn: Callable[[], AsyncOpenAI | None], has_api_key: bool = False) -> None:
    """Set the OpenAI client getter function."""
    global _get_client, _has_api_key
    _get_client = fn
    _has_api_key = has_api_key


def get_openai_client() -> AsyncOpenAI | None:
    """Get the OpenAI client."""
    if _get_client is None:
        return None
    return _get_client()


def has_openai_api_key() -> bool:
    """Check if OPENAI_API_KEY is configured."""
    return _has_api_key


# ============================================================================
# SaaS Services
# ============================================================================


def set_user_service(service: UserService) -> None:
    """Set the user service."""
    global _user_service
    _user_service = service


def get_user_service() -> UserService:
    """Get the user service."""
    if _user_service is None:
        raise RuntimeError("User service not initialized")
    return _user_service


def set_auth_service(service: AuthService) -> None:
    """Set the auth service."""
    global _auth_service
    _auth_service = service


def get_auth_service() -> AuthService:
    """Get the auth service."""
    if _auth_service is None:
        raise RuntimeError("Auth service not initialized")
    return _auth_service


def set_usage_service(service: UsageService) -> None:
    """Set the usage service."""
    global _usage_service
    _usage_service = service


def get_usage_service() -> Optional[UsageService]:
    """Get the usage service."""
    return _usage_service


def set_subscription_service(service: SubscriptionService) -> None:
    """Set the subscription service."""
    global _subscription_service
    _subscription_service = service


def get_subscription_service() -> Optional[SubscriptionService]:
    """Get the subscription service."""
    return _subscription_service


def set_payment_service(service: PaymentService) -> None:
    """Set the payment service."""
    global _payment_service
    _payment_service = service


def get_payment_service() -> Optional[PaymentService]:
    """Get the payment service."""
    return _payment_service
