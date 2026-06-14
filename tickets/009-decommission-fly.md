# 009 — Decommission Fly / Docker deploy config

**Status:** DONE
**Area:** infra / cleanup
**Size:** S
**Depends on:** #008 (no server to containerize)

## Why
We're moving off Fly to the basement box (see #000). The container/Fly config no
longer reflects how the app runs.

## Live teardown: DONE
The Fly.io app (and its Postgres) are **already decommissioned** (confirmed by
owner, June 2026). No `fly` CLI work remains — this ticket is now purely in-repo
config cleanup.

## Work (in-repo only)
- Remove `fly.toml`.
- Remove `Dockerfile` (the basement box runs Node directly via cron; no
  container needed). If we later want containerization on the box, reintroduce a
  slim job-oriented image — but not a server image with `EXPOSE 8080`.
- Update `README.md`: drop the Travis badge / Fly references; document the
  basement + cron + SQLite setup instead.

## Notes
- Keep `.github/workflows/verify.yaml` (CI lint/build/test still useful), just
  swap the `TWITTER_*` env block for `BLUESKY_*` (handled in #004).
