"""Cloudflare Turnstile verification.

Stdlib-only, matching app.security's approach. TURNSTILE_SECRET_KEY unset
(local dev, tests) means verification is skipped — there's no captcha
widget to solve locally, and CI shouldn't need network access to Cloudflare.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_captcha(token: str) -> bool:
    secret = os.environ.get("TURNSTILE_SECRET_KEY")
    if not secret:
        return True

    data = json.dumps({"secret": secret, "response": token}).encode()
    request = urllib.request.Request(
        VERIFY_URL, data=data, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as resp:
            result = json.loads(resp.read())
    except (urllib.error.URLError, TimeoutError):
        return False
    return bool(result.get("success"))
