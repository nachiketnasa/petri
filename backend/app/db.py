"""Database wiring.

Which database the server talks to is entirely controlled by the
`DATABASE_URL` environment variable (any SQLAlchemy connection URL) — this
module and everything built on top of it (app/db_models.py, app/store.py)
only ever go through SQLAlchemy's engine/session API, never anything
SQLite-specific, so switching to Postgres later is a matter of setting
`DATABASE_URL=postgresql+psycopg://...` (and `uv add psycopg[binary]`),
not rewriting the store.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./petri.db")

# SQLite needs a couple of dialect-specific knobs to behave under a
# threaded ASGI server; other dialects (Postgres, ...) get plain defaults.
connect_args: dict = {}
engine_kwargs: dict = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Creates any missing tables. Safe to call every startup."""
    from app import db_models  # noqa: F401 — registers models on Base.metadata

    Base.metadata.create_all(bind=engine)


def drop_db() -> None:
    """Drops every table. Used to reset state between tests."""
    from app import db_models  # noqa: F401

    Base.metadata.drop_all(bind=engine)
