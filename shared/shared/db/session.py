"""Database engine — Postgres in AWS mode, SQLite in local mode."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from shared.config import get_settings
from shared.runtime import resolve_runtime_mode

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _resolve_database_url() -> str:
    settings = get_settings()
    mode = resolve_runtime_mode()
    url = settings.resolved_database_url()
    if mode == "local" and url.startswith("postgresql"):
        root = Path(__file__).resolve().parents[3]
        db_path = root / "data" / "commerce.db"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite+aiosqlite:///{db_path.as_posix()}"
    return url


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        url = _resolve_database_url()
        kwargs: dict = {"echo": False}
        if url.startswith("sqlite"):
            kwargs["connect_args"] = {"check_same_thread": False}
        _engine = create_async_engine(url, **kwargs)
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(), class_=AsyncSession, expire_on_commit=False
        )
    return _session_factory


async def init_db() -> None:
    from shared.models import Base  # noqa: F401 — register models

    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
