"""The repository layer — routers only ever call functions defined here.

Backed by SQLAlchemy (see app/db.py, app/db_models.py), pointed at whatever
`DATABASE_URL` says (SQLite by default). Every function still returns the
same plain dataclasses (UserRecord, ExperimentRecord, ...) it always has,
so routers and app/security.py needed zero changes when this moved off the
old in-memory dicts — and won't need to change again when a later
DATABASE_URL points at Postgres instead of SQLite.
"""

from __future__ import annotations

import secrets
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterator

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import schemas
from app.db import SessionLocal, drop_db, init_db
from app.db_models import CheckInModel, ExperimentModel, RetroModel, TokenModel, UserModel
from app.errors import ConflictError, NotFoundError
from app.security import hash_password, verify_password

EDITABLE_COLUMNS = {"backlog", "active"}
VERIFICATION_TOKEN_TTL = timedelta(hours=24)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.isoformat()


@contextmanager
def _session() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# ---- domain DTOs returned to callers (never the ORM models directly) -----


@dataclass
class CheckInRecord:
    id: str
    value: str
    note: str
    created_at: str

    def to_schema(self) -> schemas.CheckIn:
        return schemas.CheckIn(id=self.id, value=self.value, note=self.note, createdAt=self.created_at)


@dataclass
class RetroRecord:
    worked: str
    not_worked: str
    decision: schemas.Decision

    def to_schema(self) -> schemas.Retro:
        return schemas.Retro(worked=self.worked, notWorked=self.not_worked, decision=self.decision)


@dataclass
class ExperimentRecord:
    id: str
    owner_id: str
    title: str
    hypothesis: str
    cadence: schemas.Cadence
    checkin_type: schemas.CheckinType
    duration_value: int
    duration_unit: schemas.DurationUnit
    column: schemas.Column
    checkins: list[CheckInRecord]
    retro: RetroRecord | None
    shared: bool
    share_token: str | None
    created_at: str

    def to_schema(self) -> schemas.Experiment:
        return schemas.Experiment(
            id=self.id,
            title=self.title,
            hypothesis=self.hypothesis,
            cadence=self.cadence,
            checkinType=self.checkin_type,
            durationValue=self.duration_value,
            durationUnit=self.duration_unit,
            column=self.column,
            checkins=[c.to_schema() for c in self.checkins],
            retro=self.retro.to_schema() if self.retro else None,
            shared=self.shared,
            shareToken=self.share_token,
            createdAt=self.created_at,
        )

    def to_public_schema(self) -> schemas.PublicExperiment:
        return schemas.PublicExperiment(
            title=self.title,
            hypothesis=self.hypothesis,
            cadence=self.cadence,
            column=self.column,
            checkinCount=len(self.checkins),
        )


@dataclass
class UserRecord:
    id: str
    name: str
    email: str
    password_hash: str
    bio: str
    avatar_url: str | None
    avatar_color: schemas.AvatarColor
    email_verified: bool
    verification_token: str | None

    def to_schema(self) -> schemas.User:
        return schemas.User(
            id=self.id,
            name=self.name,
            email=self.email,
            bio=self.bio,
            avatarUrl=self.avatar_url,
            avatarColor=self.avatar_color,
        )


# ---- ORM row -> DTO mapping -----------------------------------------------


def _checkin_to_record(model: CheckInModel) -> CheckInRecord:
    return CheckInRecord(id=model.id, value=model.value, note=model.note, created_at=_iso(model.created_at))


def _retro_to_record(model: RetroModel | None) -> RetroRecord | None:
    if model is None:
        return None
    return RetroRecord(worked=model.worked, not_worked=model.not_worked, decision=model.decision)  # type: ignore[arg-type]


def _experiment_to_record(model: ExperimentModel) -> ExperimentRecord:
    return ExperimentRecord(
        id=model.id,
        owner_id=model.owner_id,
        title=model.title,
        hypothesis=model.hypothesis,
        cadence=model.cadence,  # type: ignore[arg-type]
        checkin_type=model.checkin_type,  # type: ignore[arg-type]
        duration_value=model.duration_value,
        duration_unit=model.duration_unit,  # type: ignore[arg-type]
        column=model.column,  # type: ignore[arg-type]
        checkins=[_checkin_to_record(c) for c in model.checkins],
        retro=_retro_to_record(model.retro),
        shared=model.shared,
        share_token=model.share_token,
        created_at=_iso(model.created_at),
    )


def _user_to_record(model: UserModel) -> UserRecord:
    return UserRecord(
        id=model.id,
        name=model.name,
        email=model.email,
        password_hash=model.password_hash,
        bio=model.bio,
        avatar_url=model.avatar_url,
        avatar_color=model.avatar_color,  # type: ignore[arg-type]
        email_verified=model.email_verified,
        verification_token=model.verification_token,
    )


# ---- lifecycle -------------------------------------------------------


def reset() -> None:
    """Drops and recreates every table. Used between tests for isolation."""
    drop_db()
    init_db()


def has_any_users() -> bool:
    """Used at startup to seed demo data only into a genuinely fresh database
    — unlike the old in-memory store, a SQLite file survives a server
    restart, so seeding unconditionally would try to recreate the demo
    account every time and fail on its duplicate email."""
    with _session() as session:
        return session.scalar(select(UserModel.id).limit(1)) is not None


# ---- users & auth ---------------------------------------------------------


def create_user(name: str, email: str, password: str, *, email_verified: bool = False) -> UserRecord:
    with _session() as session:
        existing = session.scalar(select(UserModel).where(UserModel.email == email))
        if existing is not None:
            raise ConflictError("An account with this email already exists.")
        model = UserModel(
            id=_new_id("u"),
            name=name,
            email=email,
            password_hash=hash_password(password),
            email_verified=email_verified,
            verification_token=None if email_verified else secrets.token_urlsafe(32),
            verification_token_expires_at=None if email_verified else _utcnow() + VERIFICATION_TOKEN_TTL,
        )
        session.add(model)
        session.commit()
        return _user_to_record(model)


def authenticate(email: str, password: str) -> UserRecord | None:
    with _session() as session:
        model = session.scalar(select(UserModel).where(UserModel.email == email))
        if model is None or not verify_password(password, model.password_hash):
            return None
        return _user_to_record(model)


def get_user_by_email(email: str) -> UserRecord | None:
    with _session() as session:
        model = session.scalar(select(UserModel).where(UserModel.email == email))
        return _user_to_record(model) if model else None


def regenerate_verification_token(user_id: str) -> str | None:
    """Returns None if the user is already verified (nothing to resend)."""
    with _session() as session:
        model = session.get(UserModel, user_id)
        if model is None or model.email_verified:
            return None
        model.verification_token = secrets.token_urlsafe(32)
        model.verification_token_expires_at = _utcnow() + VERIFICATION_TOKEN_TTL
        session.commit()
        return model.verification_token


def verify_email_token(token: str) -> UserRecord | None:
    with _session() as session:
        model = session.scalar(select(UserModel).where(UserModel.verification_token == token))
        if model is None or model.verification_token_expires_at is None:
            return None
        expires_at = model.verification_token_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < _utcnow():
            return None
        model.email_verified = True
        model.verification_token = None
        model.verification_token_expires_at = None
        session.commit()
        return _user_to_record(model)


def issue_token(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    with _session() as session:
        session.add(TokenModel(token=token, user_id=user_id))
        session.commit()
    return token


def revoke_token(token: str) -> None:
    with _session() as session:
        model = session.get(TokenModel, token)
        if model is not None:
            session.delete(model)
            session.commit()


def get_user_by_token(token: str) -> UserRecord | None:
    with _session() as session:
        token_model = session.get(TokenModel, token)
        if token_model is None:
            return None
        user_model = session.get(UserModel, token_model.user_id)
        return _user_to_record(user_model) if user_model else None


def user_to_schema(record: UserRecord) -> schemas.User:
    return record.to_schema()


def update_user(user_id: str, patch: schemas.ProfilePatch) -> UserRecord:
    with _session() as session:
        model = session.get(UserModel, user_id)
        assert model is not None
        model.name = patch.name
        model.bio = patch.bio
        model.avatar_url = patch.avatarUrl
        model.avatar_color = patch.avatarColor
        session.commit()
        return _user_to_record(model)


def delete_user(user_id: str) -> None:
    with _session() as session:
        model = session.get(UserModel, user_id)
        if model is None:
            return
        session.delete(model)  # cascades to their experiments and tokens
        session.commit()


# ---- experiments ------------------------------------------------------


def list_experiments(owner_id: str) -> list[ExperimentRecord]:
    with _session() as session:
        models = session.scalars(select(ExperimentModel).where(ExperimentModel.owner_id == owner_id)).all()
        return [_experiment_to_record(m) for m in models]


def create_experiment(owner_id: str, data: schemas.NewExperimentRequest) -> ExperimentRecord:
    with _session() as session:
        model = ExperimentModel(
            id=_new_id("e"),
            owner_id=owner_id,
            title=data.title.strip(),
            hypothesis=data.hypothesis.strip(),
            cadence=data.cadence,
            checkin_type=data.checkinType,
            duration_value=data.durationValue,
            duration_unit=data.durationUnit,
            column="backlog",
        )
        session.add(model)
        session.commit()
        return _experiment_to_record(model)


def _get_owned_model(session: Session, owner_id: str, experiment_id: str) -> ExperimentModel:
    model = session.get(ExperimentModel, experiment_id)
    if model is None or model.owner_id != owner_id:
        raise NotFoundError("Experiment not found.")
    return model


def edit_experiment(owner_id: str, experiment_id: str, title: str | None, hypothesis: str | None) -> ExperimentRecord:
    with _session() as session:
        model = _get_owned_model(session, owner_id, experiment_id)
        if model.column not in EDITABLE_COLUMNS:
            raise ConflictError("Only Backlog or Active experiments can be edited.")
        if title is not None:
            model.title = title.strip()
        if hypothesis is not None:
            model.hypothesis = hypothesis.strip()
        session.commit()
        return _experiment_to_record(model)


def delete_experiment(owner_id: str, experiment_id: str) -> None:
    with _session() as session:
        model = _get_owned_model(session, owner_id, experiment_id)
        if model.column not in EDITABLE_COLUMNS:
            raise ConflictError("Only Backlog or Active experiments can be deleted.")
        session.delete(model)
        session.commit()


def move_experiment(owner_id: str, experiment_id: str, column: schemas.Column) -> ExperimentRecord:
    with _session() as session:
        model = _get_owned_model(session, owner_id, experiment_id)
        if column == "archived" and model.retro is None:
            raise ConflictError("Complete a retro before archiving this experiment.")
        model.column = column
        session.commit()
        return _experiment_to_record(model)


def add_checkin(owner_id: str, experiment_id: str, value: str, note: str) -> ExperimentRecord:
    with _session() as session:
        model = _get_owned_model(session, owner_id, experiment_id)
        if model.column != "active":
            raise ConflictError("Check-ins can only be logged while an experiment is Active.")
        session.add(CheckInModel(id=_new_id("c"), experiment_id=model.id, value=value, note=note))
        session.commit()
        session.refresh(model)
        return _experiment_to_record(model)


def submit_retro(
    owner_id: str, experiment_id: str, worked: str, not_worked: str, decision: schemas.Decision
) -> ExperimentRecord:
    with _session() as session:
        model = _get_owned_model(session, owner_id, experiment_id)
        if model.retro is not None:
            model.retro.worked = worked
            model.retro.not_worked = not_worked
            model.retro.decision = decision
        else:
            model.retro = RetroModel(experiment_id=model.id, worked=worked, not_worked=not_worked, decision=decision)
        model.column = "archived"
        session.commit()
        session.refresh(model)
        return _experiment_to_record(model)


def toggle_share(owner_id: str, experiment_id: str) -> ExperimentRecord:
    with _session() as session:
        model = _get_owned_model(session, owner_id, experiment_id)
        model.shared = not model.shared
        model.share_token = secrets.token_urlsafe(6) if model.shared else None
        session.commit()
        return _experiment_to_record(model)


def get_shared_experiment(token: str) -> ExperimentRecord | None:
    with _session() as session:
        model = session.scalar(
            select(ExperimentModel).where(ExperimentModel.shared.is_(True), ExperimentModel.share_token == token)
        )
        return _experiment_to_record(model) if model else None


# ---- demo seed data ---------------------------------------------------


def seed_demo_data() -> None:
    """Populates a demo account so the frontend has something to show on a
    fresh boot. Never called by `reset()` — tests stay on a clean slate and
    build their own fixtures via the API."""
    demo = create_user(name="Demo", email="demo@petri.app", password="password123", email_verified=True)

    with _session() as session:

        def add(column: str, **kwargs) -> None:
            checkins = kwargs.pop("checkins", [])
            retro = kwargs.pop("retro", None)
            shared = kwargs.pop("shared", False)
            model = ExperimentModel(id=_new_id("e"), owner_id=demo.id, column=column, **kwargs)
            model.checkins = checkins
            if retro is not None:
                model.retro = retro
            if shared:
                model.shared = True
                model.share_token = "demo-journal"
            session.add(model)

        def ci(value: str, note: str = "") -> CheckInModel:
            return CheckInModel(id=_new_id("c"), value=value, note=note)

        add(
            "backlog",
            title="Cold showers experiment",
            hypothesis="A 5-minute cold shower each morning improves my focus by mid-morning.",
            cadence="Daily",
            checkin_type="done",
            duration_value=21,
            duration_unit="days",
        )
        add(
            "backlog",
            title="No phone before 9am",
            hypothesis="Delaying phone use for the first hour reduces morning anxiety.",
            cadence="Daily",
            checkin_type="done",
            duration_value=14,
            duration_unit="days",
        )
        add(
            "active",
            title="10-minute journaling",
            hypothesis="Journaling before bed improves how rested I feel the next day.",
            cadence="Daily",
            checkin_type="rating",
            duration_value=4,
            duration_unit="weeks",
            checkins=[ci("4", "Felt clear-headed after."), ci("3"), ci("5", "Best sleep this week.")],
            shared=True,
        )
        add(
            "active",
            title="Walk after lunch",
            hypothesis="A short walk after lunch reduces my 3pm energy crash.",
            cadence="Daily",
            checkin_type="done",
            duration_value=3,
            duration_unit="weeks",
            checkins=[ci("done"), ci("done", "Took the long way, felt great.")],
        )
        add(
            "reflect",
            title="Read 20 pages before bed",
            hypothesis="Reading instead of scrolling helps me fall asleep faster.",
            cadence="Daily",
            checkin_type="done",
            duration_value=2,
            duration_unit="weeks",
            checkins=[ci("done"), ci("skip", "Too tired."), ci("done")],
        )
        add(
            "archived",
            title="Standing desk for a week",
            hypothesis="Standing more during work reduces afternoon back pain.",
            cadence="Daily",
            checkin_type="done",
            duration_value=1,
            duration_unit="weeks",
            checkins=[ci("done")],
            retro=RetroModel(
                worked="Noticed less stiffness by day 3.",
                not_worked="Forgot to switch back down before calls.",
                decision="continue",
            ),
        )
        add(
            "archived",
            title="Track water intake",
            hypothesis="Logging water intake would help me drink more during the day.",
            cadence="Daily",
            checkin_type="done",
            duration_value=10,
            duration_unit="days",
            retro=RetroModel(
                worked="Nothing really.",
                not_worked="Logging felt like a chore, gave up by day 4.",
                decision="stop",
            ),
        )

        session.commit()
