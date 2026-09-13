NEW_EXPERIMENT = {
    "title": "10-minute journaling",
    "hypothesis": "Journaling before bed improves how rested I feel.",
    "cadence": "Daily",
    "checkinType": "rating",
    "durationValue": 4,
    "durationUnit": "weeks",
}


def test_unknown_token_is_not_found(client):
    resp = client.get("/shared/does-not-exist")
    assert resp.status_code == 404


def test_shared_experiment_is_readable_without_auth(auth_client, client):
    exp = auth_client.post("/experiments", json=NEW_EXPERIMENT).json()
    auth_client.post(f"/experiments/{exp['id']}/move", json={"column": "active"})
    auth_client.post(f"/experiments/{exp['id']}/checkins", json={"value": "4", "note": "Slept well."})
    share = auth_client.post(f"/experiments/{exp['id']}/share").json()

    resp = client.get(f"/shared/{share['shareToken']}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == NEW_EXPERIMENT["title"]
    assert body["hypothesis"] == NEW_EXPERIMENT["hypothesis"]
    assert body["cadence"] == "Daily"
    assert body["column"] == "active"
    assert body["checkinCount"] == 1

    # never leaks check-in notes or retro content
    assert "checkins" not in body
    assert "retro" not in body


def test_unsharing_invalidates_the_old_token(auth_client, client):
    exp = auth_client.post("/experiments", json=NEW_EXPERIMENT).json()
    share = auth_client.post(f"/experiments/{exp['id']}/share").json()
    token = share["shareToken"]

    auth_client.post(f"/experiments/{exp['id']}/share")  # toggle back off

    resp = client.get(f"/shared/{token}")
    assert resp.status_code == 404
