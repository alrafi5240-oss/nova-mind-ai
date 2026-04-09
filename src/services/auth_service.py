"""Authentication service for user login and API key validation."""

from __future__ import annotations

import hashlib
import logging
from typing import Optional, Tuple

from src.models.user import User
from src.services.user_service import UserService

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations."""

    def __init__(self, user_service: UserService):
        """Initialize auth service.

        Args:
            user_service: UserService instance
        """
        self.user_service = user_service

    async def register(
        self,
        email: str,
        username: str,
        password: str,
    ) -> Tuple[bool, Optional[User], str]:
        """Register a new user.

        Args:
            email: Email address
            username: Username
            password: Password (plain text)

        Returns:
            Tuple of (success, user_object, message)
        """
        try:
            # Validate inputs
            if not email or not username or not password:
                return False, None, "Missing required fields"

            if len(password) < 8:
                return False, None, "Password must be at least 8 characters"

            if len(username) < 3:
                return False, None, "Username must be at least 3 characters"

            # Hash password
            password_hash = self._hash_password(password)

            # Create user
            user = await self.user_service.create_user(
                email=email,
                username=username,
                password_hash=password_hash,
            )

            if not user:
                return False, None, "Email or username already registered"

            logger.info(f"Registered user: {user.user_id}")
            return True, user, "Registration successful"

        except Exception as e:
            logger.error(f"Registration failed: {e}")
            return False, None, f"Registration error: {str(e)}"

    async def login(
        self,
        email_or_username: str,
        password: str,
    ) -> Tuple[bool, Optional[User], str]:
        """Authenticate user with password.

        Args:
            email_or_username: Email or username
            password: Password (plain text)

        Returns:
            Tuple of (success, user_object, message)
        """
        try:
            # Find user
            user = None
            if "@" in email_or_username:
                user = await self.user_service.get_user_by_email(email_or_username)
            else:
                user = await self.user_service.get_user_by_username(email_or_username)

            if not user:
                logger.warning(f"Login failed: User not found ({email_or_username})")
                return False, None, "Invalid credentials"

            if not user.is_active:
                logger.warning(f"Login failed: User suspended ({user.user_id})")
                return False, None, "Account is suspended"

            # Verify password
            password_hash = self._hash_password(password)
            stored_password = await self.user_service.storage.load(f"password:{user.user_id}")

            if not stored_password or stored_password.get("hash") != password_hash:
                logger.warning(f"Login failed: Invalid password ({user.user_id})")
                return False, None, "Invalid credentials"

            logger.info(f"User logged in: {user.user_id}")
            return True, user, "Login successful"

        except Exception as e:
            logger.error(f"Login failed: {e}")
            return False, None, f"Login error: {str(e)}"

    async def validate_api_key(self, api_key: str) -> Tuple[bool, Optional[User]]:
        """Validate API key and return user.

        Args:
            api_key: API key to validate

        Returns:
            Tuple of (is_valid, user_object)
        """
        try:
            if not api_key:
                return False, None

            user = await self.user_service.get_user_by_api_key(api_key)

            if not user:
                logger.debug(f"Invalid API key attempted")
                return False, None

            if not user.is_active:
                logger.warning(f"API call from suspended user: {user.user_id}")
                return False, None

            logger.debug(f"Valid API key: {user.user_id}")
            return True, user

        except Exception as e:
            logger.error(f"API key validation failed: {e}")
            return False, None

    async def verify_password(self, user: User, password: str) -> bool:
        """Verify password for user.

        Args:
            user: User object
            password: Password to verify

        Returns:
            True if password is correct
        """
        try:
            password_hash = self._hash_password(password)
            stored_password = await self.user_service.storage.load(f"password:{user.user_id}")

            if not stored_password:
                return False

            return stored_password.get("hash") == password_hash

        except Exception as e:
            logger.error(f"Password verification failed: {e}")
            return False

    async def change_password(self, user: User, old_password: str, new_password: str) -> Tuple[bool, str]:
        """Change user password.

        Args:
            user: User object
            old_password: Current password
            new_password: New password

        Returns:
            Tuple of (success, message)
        """
        try:
            # Verify old password
            if not await self.verify_password(user, old_password):
                return False, "Current password is incorrect"

            # Validate new password
            if len(new_password) < 8:
                return False, "New password must be at least 8 characters"

            # Hash and save new password
            password_hash = self._hash_password(new_password)
            await self.user_service.storage.save(
                f"password:{user.user_id}",
                {"hash": password_hash},
            )

            logger.info(f"Password changed: {user.user_id}")
            return True, "Password changed successfully"

        except Exception as e:
            logger.error(f"Password change failed: {e}")
            return False, f"Password change error: {str(e)}"

    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash password using SHA-256.

        Note: For production, use bcrypt or argon2 instead.

        Args:
            password: Plain text password

        Returns:
            Hashed password
        """
        return hashlib.sha256(password.encode()).hexdigest()

    @staticmethod
    def extract_api_key_from_header(authorization_header: Optional[str]) -> Optional[str]:
        """Extract API key from Authorization header.

        Supports:
        - Bearer {api_key}
        - {api_key}

        Args:
            authorization_header: Value of Authorization header

        Returns:
            API key or None
        """
        if not authorization_header:
            return None

        header = authorization_header.strip()

        # Check for "Bearer {key}" format
        if header.lower().startswith("bearer "):
            return header[7:].strip()

        # Check for plain key
        if len(header) == 32:  # UUID without dashes
            return header

        return None
