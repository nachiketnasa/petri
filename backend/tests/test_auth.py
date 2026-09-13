def test_signup_returns_user_and_token(client):
    resp = client.post(
        "/auth/signup",
        json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["token"]
    user = body["user"]
    assert user["name"] == "Ada"
    assert user["email"] == "ada@example.com"
    assert user["bio"] == ""
    assert user["avatarUrl"] is None
    assert user["avatarColor"] == "green"
    assert "password" not in user


def test_signup_rejects_duplicate_email(client):
    client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    resp = client.post("/auth/signup", json={"name": "Ada 2", "email": "ada@example.com", "password": "somethingelse"})
    assert resp.status_code == 409


def test_login_with_correct_credentials(client):
    client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    resp = client.post("/auth/login", json={"email": "ada@example.com", "password": "hunter22"})
    assert resp.status_code == 200
    assert resp.json()["token"]


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
