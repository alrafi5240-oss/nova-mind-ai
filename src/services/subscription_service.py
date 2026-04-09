"""Subscription management service for SaaS system."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

from src.models.subscription import Subscription, SubscriptionStatus
from src.models.user import UserPlan
from src.storage.memory import MemoryStorage

logger = logging.getLogger(__name__)


class SubscriptionService:
    """Service for managing user subscriptions."""

    # Plan pricing
    PLAN_PRICING = {
        "free": 0.0,
        "basic": 5.0,
        "pro": 20.0,
        "elite": 150.0,  # $150/month average
    }

    # Plan limits
    PLAN_LIMITS = {
        "free": 10,
        "basic": 500,
        "pro": 5000,
        "elite": -1,  # Unlimited
    }

    def __init__(self, storage: MemoryStorage):
        """Initialize subscription service.

        Args:
            storage: MemoryStorage instance
        """
        self.storage = storage

    async def create_subscription(
        self,
        user_id: str,
        plan: str,
        billing_period_days: int = 30,
    ) -> Optional[Subscription]:
        """Create a new subscription for a user.

        Args:
            user_id: User ID
            plan: Plan name (free, basic, pro, elite)
            billing_period_days: Billing period in days

        Returns:
            Created Subscription object or None
        """
        try:
            # Validate plan
            if plan not in self.PLAN_PRICING:
                logger.warning(f"Invalid plan: {plan}")
                return None

            subscription_id = str(uuid.uuid4())
            now = datetime.utcnow()

            subscription = Subscription(
                subscription_id=subscription_id,
                user_id=user_id,
                plan=plan,
                status=SubscriptionStatus.ACTIVE,
                monthly_message_limit=self.PLAN_LIMITS.get(plan, 10),
                price_usd=self.PLAN_PRICING.get(plan, 0.0),
                billing_period_days=billing_period_days,
                start_date=now,
                end_date=now + timedelta(days=billing_period_days),
                auto_renew=True,
            )

            await self.storage.save(f"subscriptions:id:{subscription_id}", subscription.to_dict())
            await self.storage.save(
                f"subscriptions:user:{user_id}:latest",
                {"subscription_id": subscription_id},
            )

            logger.info(f"Created subscription {subscription_id} for user {user_id} (plan: {plan})")
            return subscription

        except Exception as e:
            logger.error(f"Failed to create subscription: {e}")
            return None

    async def get_subscription(self, subscription_id: str) -> Optional[Subscription]:
        """Get subscription by ID.

        Args:
            subscription_id: Subscription ID

        Returns:
            Subscription object or None
        """
        try:
            data = await self.storage.load(f"subscriptions:id:{subscription_id}")
            if data:
                return Subscription.from_dict(data)
        except Exception as e:
            logger.error(f"Failed to get subscription: {e}")
        return None

    async def get_user_subscription(self, user_id: str) -> Optional[Subscription]:
        """Get active subscription for a user.

        Args:
            user_id: User ID

        Returns:
            Subscription object or None if no active subscription
        """
        try:
            lookup = await self.storage.load(f"subscriptions:user:{user_id}:latest")
            if lookup:
                return await self.get_subscription(lookup["subscription_id"])
        except Exception as e:
            logger.error(f"Failed to get user subscription: {e}")
        return None

    async def upgrade_plan(
        self,
        user_id: str,
        new_plan: str,
    ) -> Optional[Subscription]:
        """Upgrade user to a new plan.

        Args:
            user_id: User ID
            new_plan: New plan name

        Returns:
            New Subscription object or None
        """
        try:
            # Deactivate current subscription
            current = await self.get_user_subscription(user_id)
            if current:
                current.status = SubscriptionStatus.CANCELLED
                await self.storage.save(f"subscriptions:id:{current.subscription_id}", current.to_dict())

            # Create new subscription
            new_sub = await self.create_subscription(user_id, new_plan)

            logger.info(f"Upgraded user {user_id} to plan {new_plan}")
            return new_sub

        except Exception as e:
            logger.error(f"Failed to upgrade plan: {e}")
            return None

    async def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a subscription.

        Args:
            subscription_id: Subscription ID

        Returns:
            True if successful
        """
        try:
            subscription = await self.get_subscription(subscription_id)
            if not subscription:
                return False

            subscription.status = SubscriptionStatus.CANCELLED
            subscription.update(status=SubscriptionStatus.CANCELLED)

            await self.storage.save(f"subscriptions:id:{subscription_id}", subscription.to_dict())

            logger.info(f"Cancelled subscription {subscription_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to cancel subscription: {e}")
            return False

    async def renew_subscription(self, subscription_id: str) -> Optional[Subscription]:
        """Renew a subscription for another period.

        Args:
            subscription_id: Subscription ID

        Returns:
            Renewed Subscription object or None
        """
        try:
            subscription = await self.get_subscription(subscription_id)
            if not subscription:
                return None

            # Extend end date
            subscription.end_date = subscription.end_date + timedelta(days=subscription.billing_period_days)
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.update(end_date=subscription.end_date, status=SubscriptionStatus.ACTIVE)

            await self.storage.save(f"subscriptions:id:{subscription_id}", subscription.to_dict())

            logger.info(f"Renewed subscription {subscription_id}")
            return subscription

        except Exception as e:
            logger.error(f"Failed to renew subscription: {e}")
            return None

    async def list_user_subscriptions(self, user_id: str) -> list[Subscription]:
        """List all subscriptions for a user.

        Args:
            user_id: User ID

        Returns:
            List of Subscription objects
        """
        try:
            subscriptions = []
            all_subs = await self.storage.list(prefix="subscriptions:id:")

            for sub_data in all_subs:
                subscription = Subscription.from_dict(sub_data)
                if subscription.user_id == user_id:
                    subscriptions.append(subscription)

            return sorted(subscriptions, key=lambda s: s.created_at, reverse=True)

        except Exception as e:
            logger.error(f"Failed to list user subscriptions: {e}")
            return []

    async def get_stats(self) -> dict:
        """Get subscription statistics.

        Returns:
            Dict with subscription stats
        """
        try:
            all_subs = await self.storage.list(prefix="subscriptions:id:")
            active = sum(1 for s in all_subs if s.get("status") == "active")
            cancelled = sum(1 for s in all_subs if s.get("status") == "cancelled")

            return {
                "total_subscriptions": len(all_subs),
                "active_subscriptions": active,
                "cancelled_subscriptions": cancelled,
            }

        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {}
