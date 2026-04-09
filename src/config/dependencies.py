"""FastAPI dependencies for database operations."""

from typing import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.db_config import get_session
from src.config.service import DatabaseService


async def get_database(session: AsyncSession = Depends(get_session)) -> AsyncGenerator[DatabaseService, None]:
    """Dependency injection for database service.

    Usage in routes:
        @router.get("/users/{user_id}")
        async def get_user(user_id: str, db: DatabaseService = Depends(get_database)):
            user = await db.users.get_by_id(user_id)
            return user
    """
    service = DatabaseService(session)
    try:
        yield service
    finally:
        await session.close()
