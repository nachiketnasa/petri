"""Password hashing and bearer-token auth for the mock store.

Stdlib-only (hashlib + secrets) since this backend's persistence layer is
itself a placeholder for a real database — not worth a dependency yet.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app import store
from app.schemas import User

_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}${digest}"


def verify_password(password: str, hashed: str) -> bool:
    salt, _, digest = hashed.partition("$")
    expected = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return hmac.compare_digest(expected, digest)


def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token.")
    return credentials.credentials


def get_current_user(token: str = Depends(get_bearer_token)) -> User:
    user_record = store.get_user_by_token(token)
    if user_record is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")
    return store.user_to_schema(user_record)
