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

Each experiment can be made **shareable**: a per-experiment toggle generates a public, read-only status page (unguessable URL, no login required to view) showing title, hypothesis, cadence, current stage, and check-in streak — not the private notes text. The user copies this link or uses share buttons (X, LinkedIn, etc. — plain `share-to` URLs, no platform API/OAuth integration) to post it wherever they like. Toggling sharing off immediately invalidates the link.

## User stories

1. As a user, I can sign up and log in so my board is private to me.
2. As a user, I can create an experiment with a hypothesis, cadence, and target duration.
3. As a user, I can see my experiments on a kanban board grouped by stage.
4. As a user, I can log a check-in (structured value + optional note) against an active experiment.
5. As a user, I can see which experiments have a check-in due today/overdue, visually flagged on the card.
6. As a user, when an experiment's duration ends (or I end it early), I'm prompted for a retro before it can move to Archived.
7. As a user, I can view an experiment's full check-in history and retro after it's archived.
8. As a user, I can edit or delete an experiment while it's in Backlog or Active.
9. As a user, I can toggle public sharing on an experiment and get a link to post on social media for accountability.
10. As a user, I can toggle sharing off, after which the old link no longer works.

## Acceptance criteria (examples)

- Creating an experiment requires: title, hypothesis, cadence, target duration. Missing any → validation error, no experiment created.
- A check-in cannot be logged against an experiment in Backlog, Reflect, or Archived — only Active.
- The "Check-in Due" state is derived (last check-in timestamp + cadence vs. now), not a manually-set column — it's a visual/query state layered on Active, not a separate persisted status. *(Open point: confirm at implementation time whether this is a real board column or a badge on Active cards — spec favors badge-on-Active per the "visual flag only" decision below.)*
- Moving an experiment to Archived requires a saved Retro (what worked, what didn't, decision) to exist first — enforced by the API, not just the UI.
- Each user's experiments, check-ins, and retros are isolated; no cross-user reads/writes.
- A shared experiment's public page exposes only title, hypothesis, cadence, stage, and check-in streak count — never check-in notes or retro content.
- The share link uses an unguessable token (not the experiment's sequential/DB id), so disabling sharing and re-enabling it issues a new token, invalidating the old link.
- Viewing a shared page requires no authentication; toggling sharing on/off requires the owning user's auth.

## Non-goals (v1)

- **No push/email notifications.** Overdue check-ins are a visual badge only, computed on read. Notification delivery (email, likely via a simple cron + mailer) is an explicit **Phase 2** item.
- No mobile app — responsive web only.
- No platform API/OAuth integration for posting (no "post to X" via their API) — sharing is a public link + plain `share-to` URLs the user clicks, not automated posting.
- No following/discovering other users' experiments, no public directory or feed — sharing is opt-in, per-experiment, link-only.
- No custom/user-defined columns — the PACT lifecycle is fixed.
- No analytics/insights dashboard (e.g. streak charts) in v1 — the retro and check-in log are the record.
- No offline support / local-first sync.

## Technical plan

1. **Product spec** (this doc) — user stories, acceptance criteria, non-goals. Done before any code.
2. **UI prototype**: draft frontend with an AI tool (Lovable/Bolt/Cursor/Claude Code), then pull into a normal repo and clean up for maintainability (proper components, no throwaway inline styles, lint-clean).
3. **OpenAPI contract**: define `openapi.yaml` as the source of truth for all endpoints (auth, experiments, check-ins, retros) before backend implementation. Frontend and backend both generate/validate against it.
4. **Backend v1**: FastAPI implementing the contract against an in-memory/mock store. Tests cover the key endpoints (create/list/update experiment, log check-in, create retro, auth) against the mock.
5. **Backend v2**: swap mock store for SQLite via a repository/interface layer, so the persistence layer is swappable (Postgres later) without touching route/service code.
6. **Tests**: unit tests (backend, against contract behavior) + frontend tests (component/interaction level) covering the acceptance criteria above.

## Name

**Petri** — a small, contained space to run an experiment and watch it grow.
