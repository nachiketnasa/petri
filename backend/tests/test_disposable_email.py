from app.disposable_email import is_disposable_email


def test_known_disposable_domain_is_blocked():
    assert is_disposable_email("someone@mailinator.com") is True


def test_domain_match_is_case_insensitive():
    assert is_disposable_email("someone@MAILINATOR.COM") is True


def test_ordinary_domain_is_allowed():
    assert is_disposable_email("someone@gmail.com") is False


def test_signup_rejects_disposable_email(client):
    resp = client.post(
        "/auth/signup",
        json={"name": "Bot", "email": "bot@mailinator.com", "password": "hunter22"},
    )
    assert resp.status_code == 400
