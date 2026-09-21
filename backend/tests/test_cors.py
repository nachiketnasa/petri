"""Regression test: a deployed frontend origin must survive CORS preflight.

We were bitten once by the frontend running on an origin (a k8s
port-forward) that wasn't in the backend's CORS allowlist — the browser
blocked signup/login before the request ever reached the API. This checks
the preflight response directly, which is what a browser actually enforces
and what UI/unit tests running outside a real browser won't catch.
"""

import os

os.environ["CORS_ORIGINS"] = "http://localhost:5173,http://localhost:8088"

import importlib

from app import main as main_module

importlib.reload(main_module)


def test_configured_origin_is_allowed_by_preflight():
    from fastapi.testclient import TestClient

    client = TestClient(main_module.app)
    resp = client.options(
        "/auth/signup",
        headers={
            "Origin": "http://localhost:8088",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert resp.status_code == 200
    assert resp.headers["access-control-allow-origin"] == "http://localhost:8088"


def test_unlisted_origin_is_rejected_by_preflight():
    from fastapi.testclient import TestClient

    client = TestClient(main_module.app)
    resp = client.options(
        "/auth/signup",
        headers={
            "Origin": "http://evil.example.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" not in resp.headers
