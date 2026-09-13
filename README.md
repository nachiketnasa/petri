# Petri — Personal Experiments Kanban

A kanban tool for running personal life experiments, based on the "Tiny Experiments" (PACT) methodology: Purposeful, Actionable, Continuous, Trackable.

## Board model

Columns (fixed, PACT-inspired lifecycle):

1. **Backlog** — idea captured, not started
2. **Active** — committed, running, check-ins expected on cadence
3. **Check-in Due** — cadence elapsed, awaiting a log entry (auto-surfaced, not manually moved)
4. **Reflect** — cadence complete or user ends it early; retro required before archiving
5. **Archived** — retro complete, experiment closed

## Core entities

- **Experiment**: title, hypothesis, cadence (daily/weekly/custom interval, set at creation), start date, target duration, status (maps to column).
- **Check-in**: belongs to an experiment. Structured field (done / not done, or 1-5 rating — pick one per experiment at creation) + optional free-text note. Timestamped.
- **Retro**: belongs to an experiment, created when moving to Archived. Fields: what worked, what didn't, decision (continue / stop / pivot / iterate).
- **User**: account owner. Each user sees only their own board.

## Sharing model

Each experiment can be made shareable: a per-experiment toggle generates a public, read-only status page (unguessable URL, no login required to view) showing title, hypothesis, cadence, current stage, and check-in streak — not the private notes text. Toggling sharing off immediately invalidates the link.

## Non-goals (v1)

- No push/email notifications (Phase 2).
- No mobile app — responsive web only.
- No platform API/OAuth integration for posting.
- No following/discovering other users' experiments.
- No custom/user-defined columns.
- No analytics/insights dashboard.
- No offline support / local-first sync.

## Technical plan

1. Product spec (`_docs/specs.md`) — done.
2. UI prototype/mockups — in progress.
3. OpenAPI contract (`openapi.yaml`) as source of truth for endpoints.
4. Backend v1: FastAPI against an in-memory/mock store.
5. Backend v2: swap mock store for SQLite via a repository layer.
6. Tests: backend unit tests + frontend component/interaction tests.

## Dev workflow

Backend dependency management uses `uv` (see `AGENTS.md`):

```
uv sync
uv add <PACKAGE-NAME>
uv run python <PYTHON-FILE>
```

Commit code to git regularly.

## Status

Spec complete. Mockups next — this README will be updated once the UI prototype lands.

See `_docs/specs.md` for full user stories and acceptance criteria.
