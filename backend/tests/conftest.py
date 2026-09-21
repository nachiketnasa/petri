import os

# Must be set before `app.db` (and anything importing it) is first loaded —
# the engine is created once, at import time, from this env var. Tests get
# their own isolated in-memory SQLite database, never the dev/prod one.
os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from fastapi.testclient import TestClient

from app import store
from app.main import app


@pytest.fixture(autouse=True)
def _reset_store():
    """Every test starts from a clean, empty database."""
    store.reset()
    yield
    store.reset()


@pytest.fixture
def client():
    return TestClient(app)


def signup_and_verify(client, name: str, email: str, password: str) -> str:
    """Signs up, verifies via the store-issued token, and returns a bearer
    token — the same real flow a user goes through, just skipping the
    actual email since tests have direct store access."""
    client.post("/auth/signup", json={"name": name, "email": email, "password": password})
    user = store.get_user_by_email(email)
    resp = client.post("/auth/verify", json={"token": user.verification_token})
    return resp.json()["token"]


@pytest.fixture
def auth_client(client):
    """A TestClient carrying a bearer token for a freshly signed-up,
    already-verified user (signup itself no longer returns a token — the
    account must be verified first, same as a real user clicking the
    emailed link)."""
    token = signup_and_verify(client, "Ada", "ada@example.com", "hunter22")
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
