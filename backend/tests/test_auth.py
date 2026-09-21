from app import store


def test_signup_returns_email_and_nothing_sensitive(client):
    resp = client.post(
        "/auth/signup",
        json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"},
    )
    assert resp.status_code == 201
    assert resp.json() == {"email": "ada@example.com"}


def test_signup_rejects_duplicate_email(client):
    client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    resp = client.post("/auth/signup", json={"name": "Ada 2", "email": "ada@example.com", "password": "somethingelse"})
    assert resp.status_code == 409


def test_login_before_verifying_is_rejected(client):
    client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    resp = client.post("/auth/login", json={"email": "ada@example.com", "password": "hunter22"})
    assert resp.status_code == 403


def test_verify_then_login_succeeds(client):
    client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    user = store.get_user_by_email("ada@example.com")

    verify_resp = client.post("/auth/verify", json={"token": user.verification_token})
    assert verify_resp.status_code == 200
    assert verify_resp.json()["token"]

    login_resp = client.post("/auth/login", json={"email": "ada@example.com", "password": "hunter22"})
    assert login_resp.status_code == 200
    assert login_resp.json()["token"]


def test_verify_with_unknown_token_is_rejected(client):
    resp = client.post("/auth/verify", json={"token": "not-a-real-token"})
    assert resp.status_code == 400


def test_verify_with_already_used_token_is_rejected(client):
    client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    user = store.get_user_by_email("ada@example.com")
    client.post("/auth/verify", json={"token": user.verification_token})

    resp = client.post("/auth/verify", json={"token": user.verification_token})
    assert resp.status_code == 400


def test_resend_verification_issues_a_new_working_token(client):
    client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    old_token = store.get_user_by_email("ada@example.com").verification_token

    resp = client.post("/auth/resend-verification", json={"email": "ada@example.com"})
    assert resp.status_code == 204

    new_token = store.get_user_by_email("ada@example.com").verification_token
    assert new_token != old_token
    assert client.post("/auth/verify", json={"token": new_token}).status_code == 200


def test_resend_verification_for_unknown_email_is_still_204(client):
    """Doesn't leak whether an email is registered."""
    resp = client.post("/auth/resend-verification", json={"email": "nobody@example.com"})
    assert resp.status_code == 204


def test_login_with_wrong_password_is_rejected(client):
    client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    resp = client.post("/auth/login", json={"email": "ada@example.com", "password": "wrong-password"})
    assert resp.status_code == 401


def test_login_with_unknown_email_is_rejected(client):
    resp = client.post("/auth/login", json={"email": "nobody@example.com", "password": "hunter22"})
    assert resp.status_code == 401


def test_protected_endpoint_without_token_is_rejected(client):
    resp = client.get("/me")
    assert resp.status_code == 401


def test_protected_endpoint_with_garbage_token_is_rejected(client):
    resp = client.get("/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


def test_logout_invalidates_the_token(auth_client):
    resp = auth_client.post("/auth/logout")
    assert resp.status_code == 204
    resp = auth_client.get("/me")
    assert resp.status_code == 401
