from unittest.mock import patch

from app.email import send_verification_email


def test_send_skipped_when_no_api_key_configured(monkeypatch):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    with patch("app.email.urllib.request.urlopen") as mock_urlopen:
        send_verification_email("someone@example.com", "token-123")
    mock_urlopen.assert_not_called()


def test_send_calls_resend_api_when_key_configured(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "test-key")
    with patch("app.email.urllib.request.urlopen") as mock_urlopen:
        send_verification_email("someone@example.com", "token-123")
    mock_urlopen.assert_called_once()
    request = mock_urlopen.call_args[0][0]
    assert request.full_url == "https://api.resend.com/emails"
    assert request.get_header("Authorization") == "Bearer test-key"
    assert request.get_header("User-agent")  # Cloudflare (fronting Resend's API) blocks urllib's default UA
    assert b"token-123" in request.data
