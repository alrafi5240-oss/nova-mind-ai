"""Database repositories for data access operations."""

from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.models import (
    User,
    Subscription,
    Payment,
    Conversation,
    Message,
    DailyUsage,
)


class UserRepository:
    """Repository for User model operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, email: str, username: str, password_hash: str, api_key: str) -> User:
        """Create a new user."""
        user = User(
            email=email,
            username=username,
            password_hash=password_hash,
            api_key=api_key,
            plan="free",
            is_active=True,
            is_verified=False,
        )
        self.session.add(user)
        await self.session.flush()
        return user

    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        stmt = select(User).where(User.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        stmt = select(User).where(User.username == username)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_api_key(self, api_key: str) -> Optional[User]:
        """Get user by API key."""
        stmt = select(User).where(User.api_key == api_key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """List all users with pagination."""
        stmt = select(User).offset(skip).limit(limit).order_by(desc(User.created_at))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update_plan(self, user_id: str, plan: str) -> Optional[User]:
        """Update user plan."""
        user = await self.get_by_id(user_id)
        if user:
            user.plan = plan
            user.updated_at = datetime.utcnow()
            await self.session.flush()
        return user

    async def update(self, user_id: str, **kwargs) -> Optional[User]:
        """Update user fields."""
        user = await self.get_by_id(user_id)
        if user:
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            user.updated_at = datetime.utcnow()
            await self.session.flush()
        return user

    async def delete(self, user_id: str) -> bool:
        """Delete user (soft delete via is_active)."""
        user = await self.get_by_id(user_id)
        if user:
            user.is_active = False
            user.updated_at = datetime.utcnow()
            await self.session.flush()
            return True
        return False

    async def count(self) -> int:
        """Count total users."""
        stmt = select(func.count(User.user_id))
        result = await self.session.execute(stmt)
        return result.scalar() or 0


class ConversationRepository:
    """Repository for Conversation model operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        user_id: str,
        conversation_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(
            conversation_id=conversation_id,
            user_id=user_id,
            title=title,
            description=description,
            is_active=True,
            is_archived=False,
        )
        self.session.add(conversation)
        await self.session.flush()
        return conversation

    async def get_by_id(self, conversation_id: str) -> Optional[Conversation]:
        """Get conversation by ID."""
        stmt = select(Conversation).where(Conversation.conversation_id == conversation_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
        archived: bool = False,
    ) -> List[Conversation]:
        """Get conversations for user."""
        stmt = (
            select(Conversation)
            .where(
                and_(
                    Conversation.user_id == user_id,
                    Conversation.is_archived == archived,
                )
            )
            .offset(skip)
            .limit(limit)
            .order_by(desc(Conversation.updated_at))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update_title(self, conversation_id: str, title: str) -> Optional[Conversation]:
        """Update conversation title."""
        conversation = await self.get_by_id(conversation_id)
        if conversation:
            conversation.title = title
            conversation.updated_at = datetime.utcnow()
            await self.session.flush()
        return conversation

    async def archive(self, conversation_id: str) -> Optional[Conversation]:
        """Archive conversation."""
        conversation = await self.get_by_id(conversation_id)
        if conversation:
            conversation.is_archived = True
            conversation.updated_at = datetime.utcnow()
            await self.session.flush()
        return conversation

    async def delete(self, conversation_id: str) -> bool:
        """Delete conversation (soft delete via is_active)."""
        conversation = await self.get_by_id(conversation_id)
        if conversation:
            conversation.is_active = False
            conversation.updated_at = datetime.utcnow()
            await self.session.flush()
            return True
        return False


class MessageRepository:
    """Repository for Message model operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        user_id: str,
        conversation_id: str,
        role: str,
        content: str,
        tokens_used: int = 0,
    ) -> Message:
        """Create a new message."""
        message = Message(
            user_id=user_id,
            conversation_id=conversation_id,
            role=role,
            content=content,
            tokens_used=tokens_used,
        )
        self.session.add(message)
        await self.session.flush()
        return message

    async def get_by_id(self, message_id: str) -> Optional[Message]:
        """Get message by ID."""
        stmt = select(Message).where(Message.message_id == message_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_conversation(
        self,
        conversation_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Message]:
        """Get messages in a conversation."""
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .offset(skip)
            .limit(limit)
            .order_by(Message.created_at)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_user_conversation(
        self,
        user_id: str,
        conversation_id: str,
    ) -> List[Message]:
        """Get all messages for a user in a specific conversation."""
        stmt = (
            select(Message)
            .where(
                and_(
                    Message.user_id == user_id,
                    Message.conversation_id == conversation_id,
                )
            )
            .order_by(Message.created_at)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count_by_conversation(self, conversation_id: str) -> int:
        """Count messages in a conversation."""
        stmt = select(func.count(Message.message_id)).where(
            Message.conversation_id == conversation_id
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def count_tokens_by_conversation(self, conversation_id: str) -> int:
        """Count total tokens in a conversation."""
        stmt = select(func.sum(Message.tokens_used)).where(
            Message.conversation_id == conversation_id
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def delete(self, message_id: str) -> bool:
        """Delete a message."""
        message = await self.get_by_id(message_id)
        if message:
            await self.session.delete(message)
            await self.session.flush()
            return True
        return False


class DailyUsageRepository:
    """Repository for DailyUsage model operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_id: str, date: str) -> DailyUsage:
        """Create a new daily usage record."""
        usage = DailyUsage(
            user_id=user_id,
            date=date,
            message_count=0,
            tokens_used=0,
        )
        self.session.add(usage)
        await self.session.flush()
        return usage

    async def get_by_user_date(self, user_id: str, date: str) -> Optional[DailyUsage]:
        """Get usage record for user on specific date."""
        stmt = select(DailyUsage).where(
            and_(
                DailyUsage.user_id == user_id,
                DailyUsage.date == date,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_or_create(self, user_id: str, date: str) -> DailyUsage:
        """Get or create usage record for user on date."""
        usage = await self.get_by_user_date(user_id, date)
        if not usage:
            usage = await self.create(user_id, date)
        return usage

    async def increment_messages(self, user_id: str, date: str, count: int = 1) -> Optional[DailyUsage]:
        """Increment message count for user on date."""
        usage = await self.get_or_create(user_id, date)
        if usage:
            usage.message_count += count
            usage.updated_at = datetime.utcnow()
            await self.session.flush()
        return usage

    async def increment_tokens(self, user_id: str, date: str, tokens: int) -> Optional[DailyUsage]:
        """Increment token count for user on date."""
        usage = await self.get_or_create(user_id, date)
        if usage:
            usage.tokens_used += tokens
            usage.updated_at = datetime.utcnow()
            await self.session.flush()
        return usage

    async def get_by_user(self, user_id: str, skip: int = 0, limit: int = 30) -> List[DailyUsage]:
        """Get usage records for user."""
        stmt = (
            select(DailyUsage)
            .where(DailyUsage.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(desc(DailyUsage.date))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_total_tokens(self, user_id: str, days: int = 30) -> int:
        """Get total tokens used in last N days."""
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=days)

        stmt = select(func.sum(DailyUsage.tokens_used)).where(
            and_(
                DailyUsage.user_id == user_id,
                DailyUsage.date >= start_date.isoformat(),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def get_total_messages(self, user_id: str, days: int = 30) -> int:
        """Get total messages sent in last N days."""
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=days)

        stmt = select(func.sum(DailyUsage.message_count)).where(
            and_(
                DailyUsage.user_id == user_id,
                DailyUsage.date >= start_date.isoformat(),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
