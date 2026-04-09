"""Database service layer for business logic operations."""

from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.repositories import (
    UserRepository,
    ConversationRepository,
    MessageRepository,
    DailyUsageRepository,
)
from src.config.models import Message, Conversation


class DatabaseService:
    """Central database service providing all data operations."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.users = UserRepository(session)
        self.conversations = ConversationRepository(session)
        self.messages = MessageRepository(session)
        self.usage = DailyUsageRepository(session)

    async def commit(self) -> None:
        """Commit all changes to database."""
        await self.session.commit()

    async def rollback(self) -> None:
        """Rollback all changes."""
        await self.session.rollback()

    # ==================== User Operations ====================

    async def get_user_by_api_key(self, api_key: str):
        """Get user by API key and verify active status."""
        user = await self.users.get_by_api_key(api_key)
        if user and user.is_active:
            return user
        return None

    async def get_user_plan_and_limit(self, user_id: str) -> Tuple[Optional[str], int]:
        """Get user's current plan and message limit."""
        user = await self.users.get_by_id(user_id)
        if not user:
            return None, 0

        # Get plan limits based on subscription or default plan
        plan_limits = {
            "free": 10,
            "basic": 500,
            "pro": 5000,
            "elite": -1,  # unlimited
        }

        return user.plan, plan_limits.get(user.plan, 10)

    # ==================== Usage Tracking Operations ====================

    async def get_today_usage(self, user_id: str) -> Tuple[int, int]:
        """Get today's message count and limit for user.

        Returns:
            Tuple of (message_count, limit)
        """
        today = datetime.utcnow().date().isoformat()
        usage = await self.usage.get_by_user_date(user_id, today)

        plan, limit = await self.get_user_plan_and_limit(user_id)

        message_count = usage.message_count if usage else 0
        return message_count, limit

    async def check_user_quota(self, user_id: str) -> Tuple[bool, str]:
        """Check if user can send a message.

        Returns:
            Tuple of (can_chat, reason)
        """
        # Check if user is active and verified
        user = await self.users.get_by_id(user_id)
        if not user:
            return False, "User not found"
        if not user.is_active:
            return False, "User account is disabled"

        # Check daily quota
        message_count, limit = await self.get_today_usage(user_id)
        if limit != -1 and message_count >= limit:
            return False, "Daily message limit reached"

        return True, "OK"

    async def increment_usage(self, user_id: str, tokens_used: int = 0) -> None:
        """Increment usage for user today."""
        today = datetime.utcnow().date().isoformat()
        await self.usage.increment_messages(user_id, today, 1)
        if tokens_used > 0:
            await self.usage.increment_tokens(user_id, today, tokens_used)
        await self.commit()

    # ==================== Conversation Operations ====================

    async def get_conversation_messages(
        self,
        user_id: str,
        conversation_id: str,
    ) -> List[Message]:
        """Get all messages in a conversation for user."""
        return await self.messages.get_by_user_conversation(user_id, conversation_id)

    async def get_user_conversations(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Conversation]:
        """Get all conversations for user."""
        return await self.conversations.get_by_user(user_id, skip, limit, archived=False)

    async def create_conversation(
        self,
        user_id: str,
        conversation_id: str,
        title: Optional[str] = None,
    ) -> Conversation:
        """Create a new conversation."""
        conversation = await self.conversations.create(
            user_id,
            conversation_id,
            title=title,
        )
        await self.commit()
        return conversation

    async def save_message(
        self,
        user_id: str,
        conversation_id: str,
        role: str,
        content: str,
        tokens_used: int = 0,
    ) -> Message:
        """Save a message to conversation."""
        message = await self.messages.create(
            user_id,
            conversation_id,
            role,
            content,
            tokens_used,
        )
        await self.commit()
        return message

    # ==================== Admin Operations ====================

    async def list_users(self, skip: int = 0, limit: int = 100) -> List:
        """List all users (admin operation)."""
        return await self.users.list_all(skip, limit)

    async def admin_change_user_plan(self, user_id: str, plan: str):
        """Change user plan (admin operation)."""
        user = await self.users.update_plan(user_id, plan)
        if user:
            await self.commit()
        return user

    async def admin_suspend_user(self, user_id: str):
        """Suspend user account (admin operation)."""
        user = await self.users.update(user_id, is_active=False)
        if user:
            await self.commit()
        return user

    async def admin_get_usage_stats(
        self,
        user_id: str,
        days: int = 30,
    ) -> dict:
        """Get usage statistics for user (admin operation)."""
        total_messages = await self.usage.get_total_messages(user_id, days)
        total_tokens = await self.usage.get_total_tokens(user_id, days)

        return {
            "user_id": user_id,
            "total_messages": total_messages,
            "total_tokens": total_tokens,
            "days": days,
        }
