"""Transactional email via Resend's HTTP API.

Stdlib-only urllib, matching app.captcha's approach. RESEND_API_KEY unset
(local dev, tests) means sending is skipped — no email provider to talk to
locally, and tests shouldn't need network access.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

API_URL = "https://api.resend.com/emails"
FROM_ADDRESS = "Petri <noreply@nachiketnasa.com>"
# Resend's API sits behind Cloudflare, which blocks urllib's default
# User-Agent as a bot signature (Cloudflare error 1010) before the request
# ever reaches Resend — a plausible-looking UA avoids that entirely.
USER_AGENT = "Mozilla/5.0 (compatible; PetriBackend/1.0)"


def _frontend_base_url() -> str:
    return os.environ.get("FRONTEND_BASE_URL", "http://localhost:5173")


def send_verification_email(to_email: str, token: str) -> None:
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        return

    verify_link = f"{_frontend_base_url()}/verify?token={token}"
    data = json.dumps(
        {
            "from": FROM_ADDRESS,
            "to": [to_email],
            "subject": "Verify your Petri account",
            "html": f'<p>Confirm your email to finish creating your Petri account:</p>'
            f'<p><a href="{verify_link}">{verify_link}</a></p>'
            f'<p>This link expires in 24 hours.</p>',
        }
    ).encode()
    request = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        urllib.request.urlopen(request, timeout=5)
    except urllib.error.HTTPError as err:
        print(f"[email] Resend send to {to_email} failed: {err.code} {err.read().decode()}", file=sys.stderr)
    except (urllib.error.URLError, TimeoutError) as err:
        print(f"[email] Resend send to {to_email} failed: {err}", file=sys.stderr)
