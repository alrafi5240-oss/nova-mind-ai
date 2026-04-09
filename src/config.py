"""Application configuration management."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables
_backend_root = Path(__file__).resolve().parent.parent
load_dotenv(_backend_root / ".env")


class Config:
    """Application configuration."""

    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    DEBUG = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))

    # Backend info
    BACKEND_VERSION = os.getenv("BACKEND_VERSION", "1.0.0")

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    @classmethod
    def validate(cls) -> None:
        """Validate required configuration.

        Raises:
            ValueError: If required config is missing
        """
        if not cls.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY environment variable is required. "
                "Set it in .env or environment."
            )

        print(f"✓ Configuration loaded (environment: {cls.ENVIRONMENT})")
        print(f"✓ OpenAI Model: {cls.OPENAI_MODEL}")
        print(f"✓ Backend Version: {cls.BACKEND_VERSION}")
