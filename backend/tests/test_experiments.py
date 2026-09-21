from conftest import signup_and_verify

NEW_EXPERIMENT = {
    "title": "Cold showers",
    "hypothesis": "A 5-minute cold shower improves my focus.",
    "cadence": "Daily",
    "checkinType": "done",
    "durationValue": 2,
    "durationUnit": "weeks",
}


def create_experiment(client, **overrides):
    payload = {**NEW_EXPERIMENT, **overrides}
    resp = client.post("/experiments", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_create_experiment_starts_in_backlog(auth_client):
    exp = create_experiment(auth_client)
    assert exp["column"] == "backlog"
    assert exp["checkins"] == []
    assert exp["retro"] is None
    assert exp["shared"] is False
    assert exp["shareToken"] is None
    assert exp["id"]


def test_create_experiment_requires_title_and_hypothesis(auth_client):
    resp = auth_client.post("/experiments", json={**NEW_EXPERIMENT, "title": ""})
    assert resp.status_code == 422

    resp = auth_client.post("/experiments", json={**NEW_EXPERIMENT, "hypothesis": ""})
    assert resp.status_code == 422


def test_list_experiments_only_returns_the_caller_s_own(auth_client, client):
    create_experiment(auth_client)

    other_token = signup_and_verify(client, "Grace", "grace@example.com", "hunter22")
    other_headers = {"Authorization": f"Bearer {other_token}"}

    assert len(auth_client.get("/experiments").json()) == 1
    assert client.get("/experiments", headers=other_headers).json() == []


def test_cannot_access_another_user_s_experiment(auth_client, client):
    exp = create_experiment(auth_client)

    other_token = signup_and_verify(client, "Grace", "grace@example.com", "hunter22")
    other_headers = {"Authorization": f"Bearer {other_token}"}

    resp = client.post(f"/experiments/{exp['id']}/move", json={"column": "active"}, headers=other_headers)
    assert resp.status_code == 404


def test_edit_experiment_in_backlog(auth_client):
    exp = create_experiment(auth_client)
    resp = auth_client.patch(f"/experiments/{exp['id']}", json={"title": "Cold showers, take two"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Cold showers, take two"


def test_delete_experiment_in_backlog(auth_client):
    exp = create_experiment(auth_client)
    resp = auth_client.delete(f"/experiments/{exp['id']}")
    assert resp.status_code == 204
    assert auth_client.get("/experiments").json() == []


def test_move_to_active_then_log_a_checkin(auth_client):
    exp = create_experiment(auth_client)
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "active"})

    resp = auth_client.post(f"/experiments/{exp['id']}/checkins", json={"value": "done", "note": "Felt great."})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["checkins"]) == 1
    assert body["checkins"][0]["value"] == "done"
    assert body["checkins"][0]["note"] == "Felt great."
    assert body["checkins"][0]["id"]
    assert body["checkins"][0]["createdAt"]


def test_checkin_rejected_unless_active(auth_client):
    exp = create_experiment(auth_client)  # still in backlog
    resp = auth_client.post(f"/experiments/{exp['id']}/checkins", json={"value": "done", "note": ""})
    assert resp.status_code == 409


def test_edit_and_delete_rejected_once_active_stage_passed(auth_client):
    exp = create_experiment(auth_client)
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "active"})
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "reflect"})

    assert auth_client.patch(f"/experiments/{exp['id']}", json={"title": "x"}).status_code == 409
    assert auth_client.delete(f"/experiments/{exp['id']}").status_code == 409


def test_move_to_archived_without_a_retro_is_rejected(auth_client):
    exp = create_experiment(auth_client)
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "active"})
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "reflect"})

    resp = auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "archived"})
    assert resp.status_code == 409


def test_submitting_a_retro_archives_the_experiment(auth_client):
    exp = create_experiment(auth_client)
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "active"})
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "reflect"})

    resp = auth_client.post(
        f"/experiments/{exp['id']}/retro",
        json={"worked": "Noticed less stiffness.", "notWorked": "Forgot some days.", "decision": "continue"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["column"] == "archived"
    assert body["retro"]["decision"] == "continue"


def test_retro_requires_all_fields(auth_client):
    exp = create_experiment(auth_client)
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "active"})
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "reflect"})

    resp = auth_client.post(
        f"/experiments/{exp['id']}/retro",
        json={"worked": "", "notWorked": "Forgot some days.", "decision": "continue"},
    )
    assert resp.status_code == 422


def test_toggle_share_sets_and_clears_a_token(auth_client):
    exp = create_experiment(auth_client)

    resp = auth_client.post(f"/experiments/{exp['id']}/share")
    assert resp.status_code == 200
    body = resp.json()
    assert body["shared"] is True
    assert body["shareToken"]

    resp = auth_client.post(f"/experiments/{exp['id']}/share")
    body = resp.json()
    assert body["shared"] is False
    assert body["shareToken"] is None
