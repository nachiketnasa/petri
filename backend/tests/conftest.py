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


@pytest.fixture
def auth_client(client):
    """A TestClient carrying a bearer token for a freshly signed-up user."""
    resp = client.post(
        "/auth/signup",
        json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"},
    )
    token = resp.json()["token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
