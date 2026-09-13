class NotFoundError(Exception):
    """Raised for a missing record, or one not owned by the caller."""


class ConflictError(Exception):
    """Raised when an action violates a business rule (e.g. the retro gate)."""
