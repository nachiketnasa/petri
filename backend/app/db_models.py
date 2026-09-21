"""SQLAlchemy ORM models — the actual table definitions.

Plain, portable column types only (String/Integer/Boolean/DateTime); nothing
SQLite-specific, so these work unchanged against Postgres or any other
SQLAlchemy-supported database once DATABASE_URL points there.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    bio: Mapped[str] = mapped_column(String, nullable=False, default="")
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_color: Mapped[str] = mapped_column(String, nullable=False, default="green")
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_token: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    verification_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    experiments: Mapped[list["ExperimentModel"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    tokens: Mapped[list["TokenModel"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class TokenModel(Base):
    __tablename__ = "tokens"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    user: Mapped["UserModel"] = relationship(back_populates="tokens")


class ExperimentModel(Base):
    __tablename__ = "experiments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    hypothesis: Mapped[str] = mapped_column(String, nullable=False)
    cadence: Mapped[str] = mapped_column(String, nullable=False)
    checkin_type: Mapped[str] = mapped_column(String, nullable=False)
    duration_value: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_unit: Mapped[str] = mapped_column(String, nullable=False)
    column: Mapped[str] = mapped_column(String, nullable=False, default="backlog")
    shared: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    share_token: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)

    owner: Mapped["UserModel"] = relationship(back_populates="experiments")
    checkins: Mapped[list["CheckInModel"]] = relationship(
        back_populates="experiment",
        cascade="all, delete-orphan",
        order_by="CheckInModel.created_at",
    )
    retro: Mapped["RetroModel | None"] = relationship(
        back_populates="experiment", cascade="all, delete-orphan", uselist=False
    )


class CheckInModel(Base):
    __tablename__ = "checkins"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    experiment_id: Mapped[str] = mapped_column(ForeignKey("experiments.id"), nullable=False, index=True)
    value: Mapped[str] = mapped_column(String, nullable=False)
    note: Mapped[str] = mapped_column(String, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)

    experiment: Mapped["ExperimentModel"] = relationship(back_populates="checkins")


class RetroModel(Base):
    __tablename__ = "retros"

    experiment_id: Mapped[str] = mapped_column(ForeignKey("experiments.id"), primary_key=True)
    worked: Mapped[str] = mapped_column(String, nullable=False)
    not_worked: Mapped[str] = mapped_column(String, nullable=False)
    decision: Mapped[str] = mapped_column(String, nullable=False)

    experiment: Mapped["ExperimentModel"] = relationship(back_populates="retro")
