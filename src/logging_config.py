"""Logging configuration for production."""

import logging
import logging.handlers
import os
import sys
from pathlib import Path

# Create logs directory
LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Log format
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
LOG_FORMAT_DETAILED = "%(asctime)s [%(levelname)s] %(name)s:%(funcName)s:%(lineno)d: %(message)s"

# Use detailed format in development
if ENVIRONMENT == "development":
    FORMAT = LOG_FORMAT_DETAILED
else:
    FORMAT = LOG_FORMAT


def setup_logging():
    """Configure logging system with file and console handlers."""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, LOG_LEVEL))

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, LOG_LEVEL))
    console_formatter = logging.Formatter(FORMAT)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    # File handler (rotating)
    log_file = LOGS_DIR / "app.log"
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setLevel(getattr(logging, LOG_LEVEL))
    file_formatter = logging.Formatter(FORMAT)
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)

    # Error file handler
    error_log_file = LOGS_DIR / "error.log"
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8"
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    root_logger.addHandler(error_handler)

    # Log startup info
    logger = logging.getLogger(__name__)
    logger.info("=" * 60)
    logger.info("Logging initialized")
    logger.info(f"Environment: {ENVIRONMENT}")
    logger.info(f"Log level: {LOG_LEVEL}")
    logger.info(f"Log files: {LOGS_DIR}")
    logger.info("=" * 60)

    return root_logger


# Initialize on module import
setup_logging()
