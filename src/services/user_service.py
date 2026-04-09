"""User management service for SaaS system."""

from __future__ import annotations

import logging
import uuid
from typing import Optional

from src.models.user import User, UserPlan
from src.storage.memory import MemoryStorage

logger = logging.getLogger(__name__)


class UserService:
    """Service for user CRUD operations and management."""

    def __init__(self, storage: MemoryStorage):
        """Initialize user service.

        Args:
            storage: MemoryStorage instance for persistence
        """
        self.storage = storage

    async def create_user(
        self,
        email: str,
        username: str,
        password_hash: str,
        plan: UserPlan = UserPlan.FREE,
    ) -> Optional[User]:
        """Create a new user.

        Args:
            email: User email
            username: Username
            password_hash: Hashed password
            plan: Initial plan (default: free)

        Returns:
            Created User object or None if failed
        """
        try:
            # Check if email exists
            if await self.get_user_by_email(email):
                logger.warning(f"Email already registered: {email}")
                return None

            # Check if username exists
            if await self.get_user_by_username(username):
                logger.warning(f"Username already taken: {username}")
                return None

            # Create user
            user_id = str(uuid.uuid4())
            api_key = self._generate_api_key()

            user = User(
                user_id=user_id,
                email=email.lower(),
                username=username.lower(),
                api_key=api_key,
                plan=plan,
                is_active=True,
            )

            # Store user
            await self.storage.save(f"users:id:{user_id}", user.to_dict())
            await self.storage.save(f"users:email:{email.lower()}", {"user_id": user_id})
            await self.storage.save(f"users:username:{username.lower()}", {"user_id": user_id})
            await self.storage.save(f"users:api_key:{api_key}", {"user_id": user_id})

            # Store password hash separately
            await self.storage.save(f"password:{user_id}", {"hash": password_hash})

            logger.info(f"Created user: {user_id} ({email})")
            return user

        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID.

        Args:
            user_id: User ID

        Returns:
            User object or None
        """
        try:
            data = await self.storage.load(f"users:id:{user_id}")
            if data:
                return User.from_dict(data)
        except Exception as e:
            logger.error(f"Failed to get user by ID: {e}")
        return None

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email.

        Args:
            email: Email address

        Returns:
            User object or None
        """
        try:
            lookup = await self.storage.load(f"users:email:{email.lower()}")
            if lookup:
                return await self.get_user_by_id(lookup["user_id"])
        except Exception as e:
            logger.error(f"Failed to get user by email: {e}")
        return None

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username.

        Args:
            username: Username

        Returns:
            User object or None
        """
        try:
            lookup = await self.storage.load(f"users:username:{username.lower()}")
            if lookup:
                return await self.get_user_by_id(lookup["user_id"])
        except Exception as e:
            logger.error(f"Failed to get user by username: {e}")
        return None

    async def get_user_by_api_key(self, api_key: str) -> Optional[User]:
        """Get user by API key.

        Args:
            api_key: API key

        Returns:
            User object or None
        """
        try:
            lookup = await self.storage.load(f"users:api_key:{api_key}")
            if lookup:
                return await self.get_user_by_id(lookup["user_id"])
        except Exception as e:
            logger.error(f"Failed to get user by API key: {e}")
        return None

    async def update_user(self, user: User, **kwargs) -> bool:
        """Update user fields.

        Args:
            user: User object to update
            **kwargs: Fields to update

        Returns:
            True if successful
        """
        try:
            user.update(**kwargs)
            await self.storage.save(f"users:id:{user.user_id}", user.to_dict())
            logger.info(f"Updated user: {user.user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update user: {e}")
            return False

    async def change_plan(self, user: User, new_plan: str) -> bool:
        """Change user's subscription plan.

        Args:
            user: User object
            new_plan: New plan name (free, basic, pro, elite)

        Returns:
            True if successful
        """
        try:
            plan = UserPlan(new_plan)
            user.update(plan=plan)
            await self.storage.save(f"users:id:{user.user_id}", user.to_dict())
            logger.info(f"Changed user {user.user_id} plan to {new_plan}")
            return True
        except Exception as e:
            logger.error(f"Failed to change plan: {e}")
            return False

    async def activate_user(self, user: User) -> bool:
        """Activate a user account.

        Args:
            user: User object

        Returns:
            True if successful
        """
        return await self.update_user(user, is_active=True)

    async def suspend_user(self, user: User) -> bool:
        """Suspend a user account.

        Args:
            user: User object

        Returns:
            True if successful
        """
        return await self.update_user(user, is_active=False)

    async def delete_user(self, user_id: str) -> bool:
        """Delete a user account (soft delete).

        Args:
            user_id: User ID to delete

        Returns:
            True if successful
        """
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return False

            # Soft delete - mark as inactive and clear sensitive data
            user.is_active = False
            user.metadata["deleted_at"] = __import__("datetime").datetime.utcnow().isoformat()

            await self.storage.save(f"users:id:{user_id}", user.to_dict())

            # Remove lookups
            await self.storage.delete(f"users:email:{user.email}")
            await self.storage.delete(f"users:username:{user.username}")
            await self.storage.delete(f"users:api_key:{user.api_key}")

            logger.info(f"Deleted user: {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete user: {e}")
            return False

    async def rotate_api_key(self, user: User) -> Optional[str]:
        """Generate a new API key for user.

        Args:
            user: User object

        Returns:
            New API key or None if failed
        """
        try:
            # Remove old key
            await self.storage.delete(f"users:api_key:{user.api_key}")

            # Generate new key
            new_api_key = self._generate_api_key()
            user.api_key = new_api_key

            await self.storage.save(f"users:id:{user.user_id}", user.to_dict())
            await self.storage.save(f"users:api_key:{new_api_key}", {"user_id": user.user_id})

            logger.info(f"Rotated API key for user: {user.user_id}")
            return new_api_key

        except Exception as e:
            logger.error(f"Failed to rotate API key: {e}")
            return None

    async def list_users(self, limit: int = 100, offset: int = 0) -> tuple[list[User], int]:
        """List all users with pagination.

        Args:
            limit: Number of users to return
            offset: Number of users to skip

        Returns:
            Tuple of (users list, total count)
        """
        try:
            all_users = await self.storage.list(prefix="users:id:")
            total = len(all_users)

            # Convert to User objects and paginate
            users = [User.from_dict(u) for u in all_users[offset : offset + limit]]

            return users, total

        except Exception as e:
            logger.error(f"Failed to list users: {e}")
            return [], 0

    async def get_stats(self) -> dict:
        """Get user statistics.

        Returns:
            Dict with user stats
        """
        try:
            users, total = await self.list_users(limit=10000)

            premium_count = sum(1 for u in users if u.is_premium)
            active_count = sum(1 for u in users if u.is_active)

            return {
                "total_users": total,
                "premium_users": premium_count,
                "free_users": total - premium_count,
                "active_users": active_count,
                "suspended_users": total - active_count,
            }

        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {}

    @staticmethod
    def _generate_api_key() -> str:
        """Generate a secure API key."""
        return str(uuid.uuid4()).replace("-", "")
