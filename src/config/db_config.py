"""Database configuration and connection management."""

import os
from typing import Optional, AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)

# Load environment variables
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_backend_root / ".env")

# Database URL configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://user:password@localhost:5432/nova_mind_ai"
)

# SQL Echo (log all SQL statements)
SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() in ("true", "1", "yes")

# Global instances
_engine: Optional[AsyncEngine] = None
_session_maker: Optional[async_sessionmaker] = None


async def create_engine() -> AsyncEngine:
    """Create async SQLAlchemy engine with connection pooling.

    Returns:
        AsyncEngine: Configured async engine with pooling
    """
    return create_async_engine(
        DATABASE_URL,
        echo=SQL_ECHO,
        future=True,
        # Connection pooling configuration
        pool_size=20,              # Number of connections to keep ready
        max_overflow=10,           # Maximum extra connections allowed
        pool_pre_ping=True,        # Test connection before using
        pool_recycle=3600,         # Recycle connection every hour
        # Application name for PostgreSQL logs
        connect_args={
            "application_name": "nova_mind_ai",
            "server_settings": {
                "application_name": "nova_mind_ai",
            },
        },
    )


async def get_session_maker() -> async_sessionmaker:
    """Get or create async session maker factory.

    Returns:
        async_sessionmaker: Session factory for creating sessions
    """
    global _session_maker
    if _session_maker is None:
        engine = await get_engine()
        _session_maker = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            future=True,
        )
    return _session_maker


async def get_engine() -> AsyncEngine:
    """Get or create async database engine.

    Returns:
        AsyncEngine: Configured async engine
    """
    global _engine
    if _engine is None:
        _engine = await create_engine()
    return _engine


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session (dependency injection).

    Yields:
        AsyncSession: Database session for operations
    """
    session_maker = await get_session_maker()
    async with session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db(engine: AsyncEngine) -> None:
    """Initialize database (create tables from models).

    Args:
        engine: AsyncEngine instance
    """
    try:
        # Import models after engine creation to avoid circular imports
        from src.config.models import Base

        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        print("✓ Database tables initialized successfully")
    except Exception as e:
        print(f"⚠ Database initialization warning: {e}")
        # Continue even if initialization fails (graceful degradation)


async def verify_connection(engine: AsyncEngine) -> bool:
    """Verify database connection is working.

    Args:
        engine: AsyncEngine instance

    Returns:
        bool: True if connection works, False otherwise
    """
    try:
        async with engine.connect() as conn:
            await conn.execute(__import__('sqlalchemy').text("SELECT 1"))
            return True
    except Exception as e:
        print(f"⚠ Database connection verification failed: {e}")
        return False


async def close_db(engine: AsyncEngine) -> None:
    """Close database connections.

    Args:
        engine: AsyncEngine instance
    """
    try:
        await engine.dispose()
        print("✓ Database connections closed")
    except Exception as e:
        print(f"⚠ Error closing database: {e}")
