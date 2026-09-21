# =============================================================================
# VERITY Backend — Database Connection
# =============================================================================
from __future__ import annotations

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

engine_kwargs = {"echo": settings.debug}
if "sqlite" in settings.database_url:
    engine_kwargs["connect_args"] = {"timeout": 60}
else:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 20,
        "max_overflow": 10,
    })

engine = create_async_engine(
    settings.database_url,
    **engine_kwargs,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency: yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables (for development)."""
    import app.models  # noqa: F401 - ensure all tables are registered in Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
