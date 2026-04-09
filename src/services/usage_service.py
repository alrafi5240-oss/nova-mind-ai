"""Usage tracking service for SaaS system."""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timedelta
from typing import Optional

from src.models.usage import DailyUsage
from src.storage.memory import MemoryStorage

logger = logging.getLogger(__name__)

# Global usage service instance
_usage_service: Optional[UsageService] = None


def get_usage_service() -> Optional[UsageService]:
    """Get global usage service instance."""
    return _usage_service


def set_usage_service(service: UsageService) -> None:
    """Set global usage service instance."""
    global _usage_service
    _usage_service = service


class UsageService:
    """Service for tracking user API usage."""

    def __init__(self, storage: MemoryStorage):
        """Initialize usage service.

        Args:
            storage: MemoryStorage instance
        """
        self.storage = storage

    async def get_or_create_today_usage(self, user_id: str) -> DailyUsage:
        """Get or create today's usage record for a user.

        Args:
            user_id: User ID

        Returns:
            DailyUsage object for today
        """
        try:
            today = date.today()
            usage = await self._load_usage(user_id, today)

            if not usage:
                # Create new usage record
                usage = DailyUsage(
                    usage_id=str(uuid.uuid4()),
                    user_id=user_id,
                    date=today,
                    message_count=0,
                    tokens_used=0,
                )
                await self._save_usage(usage)
                logger.debug(f"Created new usage record for {user_id} on {today}")

            return usage

        except Exception as e:
            logger.error(f"Failed to get/create usage record: {e}")
            # Return empty usage to allow graceful degradation
            return DailyUsage(
                usage_id=str(uuid.uuid4()),
                user_id=user_id,
                date=date.today(),
            )

    async def get_today_usage(self, user_id: str) -> int:
        """Get message count for today.

        Args:
            user_id: User ID

        Returns:
            Message count for today
        """
        try:
            usage = await self.get_or_create_today_usage(user_id)
            return usage.message_count
        except Exception as e:
            logger.error(f"Failed to get today's usage: {e}")
            return 0

    async def increment_usage(self, user_id: str, message_count: int = 1, tokens_used: int = 0) -> bool:
        """Increment usage counters for today.

        Args:
            user_id: User ID
            message_count: Number of messages to add (default: 1)
            tokens_used: Number of tokens to add

        Returns:
            True if successful
        """
        try:
            usage = await self.get_or_create_today_usage(user_id)
            usage.increment_messages(message_count)

            if tokens_used > 0:
                usage.increment_tokens(tokens_used)

            await self._save_usage(usage)
            logger.debug(f"Incremented usage for {user_id}: messages={message_count}, tokens={tokens_used}")
            return True

        except Exception as e:
            logger.error(f"Failed to increment usage: {e}")
            return False

    async def get_usage(self, user_id: str, target_date: Optional[date] = None) -> Optional[DailyUsage]:
        """Get usage record for a specific date.

        Args:
            user_id: User ID
            target_date: Date to query (default: today)

        Returns:
            DailyUsage object or None
        """
        try:
            if not target_date:
                target_date = date.today()

            return await self._load_usage(user_id, target_date)

        except Exception as e:
            logger.error(f"Failed to get usage: {e}")
            return None

    async def get_usage_range(self, user_id: str, start_date: date, end_date: date) -> list[DailyUsage]:
        """Get usage records for a date range.

        Args:
            user_id: User ID
            start_date: Start date (inclusive)
            end_date: End date (inclusive)

        Returns:
            List of DailyUsage objects
        """
        try:
            usages = []
            current_date = start_date

            while current_date <= end_date:
                usage = await self._load_usage(user_id, current_date)
                if usage:
                    usages.append(usage)
                current_date += timedelta(days=1)

            return usages

        except Exception as e:
            logger.error(f"Failed to get usage range: {e}")
            return []

    async def get_monthly_usage(self, user_id: str, year: int, month: int) -> dict:
        """Get monthly usage summary.

        Args:
            user_id: User ID
            year: Year
            month: Month (1-12)

        Returns:
            Dict with monthly totals
        """
        try:
            # Get first and last day of month
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = date(year, month + 1, 1) - timedelta(days=1)

            usages = await self.get_usage_range(user_id, start_date, end_date)

            total_messages = sum(u.message_count for u in usages)
            total_tokens = sum(u.tokens_used for u in usages)
            days_used = len(usages)

            return {
                "user_id": user_id,
                "year": year,
                "month": month,
                "total_messages": total_messages,
                "total_tokens": total_tokens,
                "days_used": days_used,
                "average_per_day": total_messages / days_used if days_used > 0 else 0,
            }

        except Exception as e:
            logger.error(f"Failed to get monthly usage: {e}")
            return {}

    async def _load_usage(self, user_id: str, target_date: date) -> Optional[DailyUsage]:
        """Load usage record from storage.

        Args:
            user_id: User ID
            target_date: Target date

        Returns:
            DailyUsage object or None
        """
        try:
            key = f"usage:{user_id}:{target_date.isoformat()}"
            data = await self.storage.load(key)

            if data:
                return DailyUsage.from_dict(data)

        except Exception as e:
            logger.error(f"Failed to load usage: {e}")

        return None

    async def _save_usage(self, usage: DailyUsage) -> bool:
        """Save usage record to storage.

        Args:
            usage: DailyUsage object

        Returns:
            True if successful
        """
        try:
            key = f"usage:{usage.user_id}:{usage.date.isoformat()}"
            await self.storage.save(key, usage.to_dict())
            return True

        except Exception as e:
            logger.error(f"Failed to save usage: {e}")
            return False

    async def get_user_stats(self, user_id: str) -> dict:
        """Get usage statistics for a user.

        Args:
            user_id: User ID

        Returns:
            Dict with usage stats
        """
        try:
            # Get last 30 days
            today = date.today()
            start_date = today - timedelta(days=29)

            usages = await self.get_usage_range(user_id, start_date, today)

            if not usages:
                return {
                    "user_id": user_id,
                    "total_messages_30d": 0,
                    "total_tokens_30d": 0,
                    "average_per_day": 0,
                    "peak_day": 0,
                    "days_active": 0,
                }

            total_messages = sum(u.message_count for u in usages)
            total_tokens = sum(u.tokens_used for u in usages)
            peak_day = max(u.message_count for u in usages)

            return {
                "user_id": user_id,
                "total_messages_30d": total_messages,
                "total_tokens_30d": total_tokens,
                "average_per_day": total_messages / len(usages) if usages else 0,
                "peak_day": peak_day,
                "days_active": len(usages),
            }

        except Exception as e:
            logger.error(f"Failed to get user stats: {e}")
            return {}
