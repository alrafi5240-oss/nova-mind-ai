"""Configuration package for NOVA MIND AI database and settings."""

from src.config.db_config import (
    get_engine,
    get_session_maker,
    get_session,
    init_db,
    verify_connection,
    close_db,
)
from src.config.service import DatabaseService
from src.config.dependencies import get_database
from src.config.models import (
    User,
    Subscription,
    Payment,
    Conversation,
    Message,
    DailyUsage,
)

__all__ = [
    # Database config
    "get_engine",
    "get_session_maker",
    "get_session",
    "init_db",
    "verify_connection",
    "close_db",
    # Service and dependencies
    "DatabaseService",
    "get_database",
    # Models
    "User",
    "Subscription",
    "Payment",
    "Conversation",
    "Message",
    "DailyUsage",
]
