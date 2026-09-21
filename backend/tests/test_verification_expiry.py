from datetime import timedelta

from app import store


def test_expired_verification_token_is_rejected(client):
    client.post("/auth/signup", json={"name": "Ada", "email": "ada@example.com", "password": "hunter22"})
    user = store.get_user_by_email("ada@example.com")

    with store._session() as session:
        from app.db_models import UserModel

        model = session.get(UserModel, user.id)
        model.verification_token_expires_at = store._utcnow() - timedelta(seconds=1)
        session.commit()

    resp = client.post("/auth/verify", json={"token": user.verification_token})
    assert resp.status_code == 400
