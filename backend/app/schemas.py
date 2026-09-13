"""Pydantic models. Field names are camelCase to match openapi.yaml and the
frontend's TypeScript types exactly — the contract both sides read."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

Cadence = Literal["Daily", "Weekly", "Custom"]
CheckinType = Literal["done", "rating"]
Column = Literal["backlog", "active", "reflect", "archived"]
Decision = Literal["continue", "stop", "pivot", "iterate"]
DurationUnit = Literal["days", "weeks"]
AvatarColor = Literal["green", "amber", "blue", "rose", "violet", "slate"]


class SignupRequest(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class User(BaseModel):
    id: str
    name: str
    email: str
    bio: str
    avatarUrl: Optional[str]
    avatarColor: AvatarColor


class AuthResponse(BaseModel):
    user: User
    token: str


class ProfilePatch(BaseModel):
    name: str = Field(min_length=1)
    bio: str
    avatarUrl: Optional[str]
    avatarColor: AvatarColor


class CheckIn(BaseModel):
    id: str
    value: str
    note: str
    createdAt: str


class Retro(BaseModel):
    worked: str = Field(min_length=1)
    notWorked: str = Field(min_length=1)
    decision: Decision


class Experiment(BaseModel):
    id: str
    title: str
    hypothesis: str
    cadence: Cadence
    checkinType: CheckinType
    durationValue: int = Field(ge=1)
    durationUnit: DurationUnit
    column: Column
    checkins: list[CheckIn]
    retro: Optional[Retro]
    shared: bool
    shareToken: Optional[str]
    createdAt: str


class NewExperimentRequest(BaseModel):
    title: str = Field(min_length=1)
    hypothesis: str = Field(min_length=1)
    cadence: Cadence
    checkinType: CheckinType
    durationValue: int = Field(ge=1)
    durationUnit: DurationUnit


class ExperimentEditRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    hypothesis: Optional[str] = Field(default=None, min_length=1)


class MoveRequest(BaseModel):
    column: Column


class CheckinRequest(BaseModel):
    value: str = Field(min_length=1)
    note: str = ""


class RetroRequest(BaseModel):
    worked: str = Field(min_length=1)
    notWorked: str = Field(min_length=1)
    decision: Decision


class PublicExperiment(BaseModel):
    title: str
    hypothesis: str
    cadence: Cadence
    column: Column
    checkinCount: int
