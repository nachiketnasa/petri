def test_get_me_returns_current_user(auth_client):
    resp = auth_client.get("/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == "ada@example.com"


def test_patch_me_updates_profile_fields(auth_client):
    resp = auth_client.patch(
        "/me",
        json={"name": "Ada L.", "bio": "Running tiny experiments.", "avatarUrl": None, "avatarColor": "violet"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Ada L."
    assert body["bio"] == "Running tiny experiments."
    assert body["avatarColor"] == "violet"


def test_patch_me_rejects_blank_name(auth_client):
    resp = auth_client.patch(
        "/me",
        json={"name": "   ", "bio": "", "avatarUrl": None, "avatarColor": "green"},
    )
    assert resp.status_code == 422


def test_delete_me_removes_account_and_its_data(auth_client):
    auth_client.post(
        "/experiments",
        json={
            "title": "Cold showers",
            "hypothesis": "Improves focus.",
            "cadence": "Daily",
            "checkinType": "done",
            "durationValue": 2,
            "durationUnit": "weeks",
        },
    )

    resp = auth_client.delete("/me")
    assert resp.status_code == 204

    # the old token no longer works
    assert auth_client.get("/me").status_code == 401


def test_can_sign_up_again_with_the_same_email_after_deleting(client):
    signup = client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    token = signup.json()["token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    client.delete("/me")
    del client.headers["Authorization"]

    resp = client.post("/auth/signup", json={"name": "Ada Again", "email": "ada@example.com", "password": "hunter22"})
    assert resp.status_code == 201
