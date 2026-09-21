import json
from unittest.mock import patch

from app.captcha import verify_captcha


def test_verification_skipped_when_no_secret_configured(monkeypatch):
    monkeypatch.delenv("TURNSTILE_SECRET_KEY", raising=False)
    assert verify_captcha("anything") is True


def test_valid_token_passes_when_cloudflare_confirms_it(monkeypatch):
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "test-secret")
    response = json.dumps({"success": True}).encode()
    with patch("app.captcha.urllib.request.urlopen") as mock_urlopen:
        mock_urlopen.return_value.__enter__.return_value.read.return_value = response
        assert verify_captcha("good-token") is True


def test_invalid_token_fails_when_cloudflare_rejects_it(monkeypatch):
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "test-secret")
    response = json.dumps({"success": False}).encode()
    with patch("app.captcha.urllib.request.urlopen") as mock_urlopen:
        mock_urlopen.return_value.__enter__.return_value.read.return_value = response
        assert verify_captcha("bad-token") is False


def test_signup_rejected_when_captcha_configured_and_token_missing(client, monkeypatch):
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "test-secret")
    response = json.dumps({"success": False}).encode()
    with patch("app.captcha.urllib.request.urlopen") as mock_urlopen:
        mock_urlopen.return_value.__enter__.return_value.read.return_value = response
        resp = client.post(
            "/auth/signup",
            json={"name": "Bot", "email": "bot@example.com", "password": "hunter22"},
        )
    assert resp.status_code == 400
