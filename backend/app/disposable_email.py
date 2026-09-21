"""Blocks signups from known disposable/temp-mail domains.

The list (app/disposable_domains.txt) is a snapshot of the community-
maintained disposable-email-domains project — not exhaustive (new temp-mail
services appear constantly), but it catches the common, long-running ones
with zero external dependency or per-request cost.
"""

from __future__ import annotations

from pathlib import Path

_DOMAINS_FILE = Path(__file__).parent / "disposable_domains.txt"
_DISPOSABLE_DOMAINS = frozenset(
    line.strip().lower() for line in _DOMAINS_FILE.read_text().splitlines() if line.strip()
)


def is_disposable_email(email: str) -> bool:
    _, _, domain = email.rpartition("@")
    return domain.lower() in _DISPOSABLE_DOMAINS
