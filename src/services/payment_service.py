"""Payment processing service for SaaS system (structure only - no live API integration yet)."""

from __future__ import annotations

import logging
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from src.models.payment import Payment, PaymentMethod, PaymentStatus
from src.storage.memory import MemoryStorage

logger = logging.getLogger(__name__)


class PaymentProvider(ABC):
    """Abstract base class for payment providers."""

    @abstractmethod
    async def create_payment(
        self,
        user_id: str,
        amount_usd: float,
        plan: str,
        currency: str = "USD",
    ) -> dict:
        """Create a payment intent.

        Args:
            user_id: User ID
            amount_usd: Amount in USD
            plan: Plan being purchased
            currency: Currency code

        Returns:
            Dict with payment intent data
        """
        pass

    @abstractmethod
    async def verify_payment(self, payment_id: str, transaction_id: str) -> bool:
        """Verify a payment was successful.

        Args:
            payment_id: Internal payment ID
            transaction_id: Provider's transaction ID

        Returns:
            True if payment is verified
        """
        pass

    @abstractmethod
    async def refund(self, payment_id: str, transaction_id: str) -> bool:
        """Refund a payment.

        Args:
            payment_id: Internal payment ID
            transaction_id: Provider's transaction ID

        Returns:
            True if refund successful
        """
        pass


class StripeProvider(PaymentProvider):
    """Stripe payment provider (structure only)."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize Stripe provider.

        Args:
            api_key: Stripe API key
        """
        self.api_key = api_key
        self.provider_name = "stripe"

    async def create_payment(
        self,
        user_id: str,
        amount_usd: float,
        plan: str,
        currency: str = "USD",
    ) -> dict:
        """Create Stripe payment intent.

        Note: This is a structure only. Actual implementation would call Stripe API.

        Args:
            user_id: User ID
            amount_usd: Amount in USD
            plan: Plan being purchased
            currency: Currency code

        Returns:
            Dict with payment intent data
        """
        logger.info(f"[STRIPE STRUCTURE] Creating payment intent for user {user_id}: ${amount_usd} {currency}")

        return {
            "provider": "stripe",
            "status": "pending",
            "client_secret": f"pi_test_{uuid.uuid4().hex[:16]}",
            "amount": int(amount_usd * 100),  # Stripe uses cents
            "currency": currency.lower(),
            "message": "In production, this would redirect to Stripe checkout",
        }

    async def verify_payment(self, payment_id: str, transaction_id: str) -> bool:
        """Verify Stripe payment.

        Note: This is a structure only. Actual implementation would call Stripe API.

        Args:
            payment_id: Internal payment ID
            transaction_id: Stripe transaction ID

        Returns:
            True (structure only)
        """
        logger.info(f"[STRIPE STRUCTURE] Verifying payment {payment_id} / {transaction_id}")
        return True

    async def refund(self, payment_id: str, transaction_id: str) -> bool:
        """Refund Stripe payment.

        Note: This is a structure only. Actual implementation would call Stripe API.

        Args:
            payment_id: Internal payment ID
            transaction_id: Stripe transaction ID

        Returns:
            True (structure only)
        """
        logger.info(f"[STRIPE STRUCTURE] Refunding payment {payment_id} / {transaction_id}")
        return True


class BKashProvider(PaymentProvider):
    """bKash payment provider (structure only)."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize bKash provider.

        Args:
            api_key: bKash API key
        """
        self.api_key = api_key
        self.provider_name = "bkash"

    async def create_payment(
        self,
        user_id: str,
        amount_usd: float,
        plan: str,
        currency: str = "BDT",
    ) -> dict:
        """Create bKash payment.

        Note: This is a structure only. Actual implementation would call bKash API.

        Args:
            user_id: User ID
            amount_usd: Amount in USD
            plan: Plan being purchased
            currency: Currency code (default: BDT)

        Returns:
            Dict with payment data
        """
        # Rough conversion: 1 USD ≈ 120 BDT
        amount_bdt = amount_usd * 120

        logger.info(f"[BKASH STRUCTURE] Creating payment for user {user_id}: {amount_bdt} BDT")

        return {
            "provider": "bkash",
            "status": "pending",
            "payment_ref": f"bkash_{uuid.uuid4().hex[:16]}",
            "amount": amount_bdt,
            "currency": currency,
            "message": "In production, user would complete bKash payment",
        }

    async def verify_payment(self, payment_id: str, transaction_id: str) -> bool:
        """Verify bKash payment.

        Note: This is a structure only. Actual implementation would call bKash API.

        Args:
            payment_id: Internal payment ID
            transaction_id: bKash transaction ID

        Returns:
            True (structure only)
        """
        logger.info(f"[BKASH STRUCTURE] Verifying payment {payment_id} / {transaction_id}")
        return True

    async def refund(self, payment_id: str, transaction_id: str) -> bool:
        """Refund bKash payment.

        Note: This is a structure only. Actual implementation would call bKash API.

        Args:
            payment_id: Internal payment ID
            transaction_id: bKash transaction ID

        Returns:
            True (structure only)
        """
        logger.info(f"[BKASH STRUCTURE] Refunding payment {payment_id} / {transaction_id}")
        return True


class NagadProvider(PaymentProvider):
    """Nagad payment provider (structure only)."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize Nagad provider.

        Args:
            api_key: Nagad API key
        """
        self.api_key = api_key
        self.provider_name = "nagad"

    async def create_payment(
        self,
        user_id: str,
        amount_usd: float,
        plan: str,
        currency: str = "BDT",
    ) -> dict:
        """Create Nagad payment.

        Note: This is a structure only. Actual implementation would call Nagad API.

        Args:
            user_id: User ID
            amount_usd: Amount in USD
            plan: Plan being purchased
            currency: Currency code (default: BDT)

        Returns:
            Dict with payment data
        """
        amount_bdt = amount_usd * 120

        logger.info(f"[NAGAD STRUCTURE] Creating payment for user {user_id}: {amount_bdt} BDT")

        return {
            "provider": "nagad",
            "status": "pending",
            "order_id": f"nagad_{uuid.uuid4().hex[:16]}",
            "amount": amount_bdt,
            "currency": currency,
            "message": "In production, user would complete Nagad payment",
        }

    async def verify_payment(self, payment_id: str, transaction_id: str) -> bool:
        """Verify Nagad payment.

        Note: This is a structure only. Actual implementation would call Nagad API.

        Args:
            payment_id: Internal payment ID
            transaction_id: Nagad transaction ID

        Returns:
            True (structure only)
        """
        logger.info(f"[NAGAD STRUCTURE] Verifying payment {payment_id} / {transaction_id}")
        return True

    async def refund(self, payment_id: str, transaction_id: str) -> bool:
        """Refund Nagad payment.

        Note: This is a structure only. Actual implementation would call Nagad API.

        Args:
            payment_id: Internal payment ID
            transaction_id: Nagad transaction ID

        Returns:
            True (structure only)
        """
        logger.info(f"[NAGAD STRUCTURE] Refunding payment {payment_id} / {transaction_id}")
        return True


class CryptoProvider(PaymentProvider):
    """Cryptocurrency payment provider (structure only - ETH/BTC)."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize Crypto provider.

        Args:
            api_key: Crypto provider API key
        """
        self.api_key = api_key
        self.provider_name = "crypto"

    async def create_payment(
        self,
        user_id: str,
        amount_usd: float,
        plan: str,
        currency: str = "ETH",
    ) -> dict:
        """Create crypto payment (ETH/BTC).

        Note: This is a structure only. Actual implementation would call crypto payment provider.

        Args:
            user_id: User ID
            amount_usd: Amount in USD
            plan: Plan being purchased
            currency: Currency code (ETH or BTC)

        Returns:
            Dict with payment data
        """
        logger.info(f"[CRYPTO STRUCTURE] Creating payment for user {user_id}: {amount_usd} USD in {currency}")

        return {
            "provider": "crypto",
            "status": "pending",
            "wallet_address": f"0x{''.join([str(uuid.uuid4().int) for _ in range(2)])}",
            "amount_usd": amount_usd,
            "currency": currency,
            "message": "In production, user would send crypto to provided wallet address",
        }

    async def verify_payment(self, payment_id: str, transaction_id: str) -> bool:
        """Verify crypto payment (blockchain confirmation).

        Note: This is a structure only. Actual implementation would check blockchain.

        Args:
            payment_id: Internal payment ID
            transaction_id: Blockchain transaction hash

        Returns:
            True (structure only)
        """
        logger.info(f"[CRYPTO STRUCTURE] Verifying payment {payment_id} / {transaction_id}")
        return True

    async def refund(self, payment_id: str, transaction_id: str) -> bool:
        """Refund crypto payment (manual process).

        Note: Crypto refunds require manual intervention.

        Args:
            payment_id: Internal payment ID
            transaction_id: Blockchain transaction hash

        Returns:
            False (manual process required)
        """
        logger.warning(f"[CRYPTO STRUCTURE] Manual refund required for {payment_id} / {transaction_id}")
        return False


class PaymentService:
    """Service for managing payments."""

    def __init__(self, storage: MemoryStorage):
        """Initialize payment service.

        Args:
            storage: MemoryStorage instance
        """
        self.storage = storage
        self.providers = {
            PaymentMethod.STRIPE: StripeProvider(),
            PaymentMethod.BKASH: BKashProvider(),
            PaymentMethod.NAGAD: NagadProvider(),
            PaymentMethod.CRYPTO: CryptoProvider(),
        }

    async def create_payment(
        self,
        user_id: str,
        amount_usd: float,
        method: str,
        plan: str,
        currency: str = "USD",
    ) -> Optional[Payment]:
        """Create a new payment.

        Args:
            user_id: User ID
            amount_usd: Amount in USD
            method: Payment method (stripe, bkash, nagad, crypto)
            plan: Plan being purchased
            currency: Currency code

        Returns:
            Created Payment object or None
        """
        try:
            payment_method = PaymentMethod(method)
            provider = self.providers.get(payment_method)

            if not provider:
                logger.warning(f"Unknown payment method: {method}")
                return None

            payment_id = str(uuid.uuid4())

            # Create payment with provider
            provider_data = await provider.create_payment(user_id, amount_usd, plan, currency)

            payment = Payment(
                payment_id=payment_id,
                user_id=user_id,
                amount_usd=amount_usd,
                currency=currency,
                method=payment_method,
                status=PaymentStatus.PENDING,
                plan=plan,
                metadata=provider_data,
            )

            await self.storage.save(f"payments:id:{payment_id}", payment.to_dict())
            await self.storage.save(f"payments:user:{user_id}:{payment_id}", {"payment_id": payment_id})

            logger.info(f"Created payment {payment_id} for user {user_id} via {method}")
            return payment

        except Exception as e:
            logger.error(f"Failed to create payment: {e}")
            return None

    async def get_payment(self, payment_id: str) -> Optional[Payment]:
        """Get payment by ID.

        Args:
            payment_id: Payment ID

        Returns:
            Payment object or None
        """
        try:
            data = await self.storage.load(f"payments:id:{payment_id}")
            if data:
                return Payment.from_dict(data)
        except Exception as e:
            logger.error(f"Failed to get payment: {e}")
        return None

    async def list_user_payments(self, user_id: str) -> list[Payment]:
        """List all payments for a user.

        Args:
            user_id: User ID

        Returns:
            List of Payment objects
        """
        try:
            payments = []
            payment_keys = await self.storage.list(prefix=f"payments:user:{user_id}:")

            for key_data in payment_keys:
                payment = await self.get_payment(key_data.get("payment_id"))
                if payment:
                    payments.append(payment)

            return sorted(payments, key=lambda p: p.created_at, reverse=True)

        except Exception as e:
            logger.error(f"Failed to list user payments: {e}")
            return []
