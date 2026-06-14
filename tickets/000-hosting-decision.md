# 000 — Hosting decision record

**Status:** DONE (decision made June 2026)
**Decision:** Self-host on the basement box. No Fly, no cloud DB.

## Context
The app is a **periodic batch job**, not a 24/7 service:
- `updateBills` — scrape the MA site, store new bills.
- `tweetBill`/post — pick the oldest un-posted bill, post it, record it.

The Express server (`src/scripts/server.ts`) only exists to receive external
POST triggers (`/updateBills`, `/tweetBill`). There is no scheduler in the repo,
so something external was poking those endpoints on the old Fly deploy.

Reliability requirements are low: if a run is missed, the next run catches up
because the DB dedupes seen/posted bills.

## Options considered
1. **Fly** — app can scale to zero (compute ~free), but a persistent Postgres
   has a cost floor (unmanaged PG = machine + volume; managed = Supabase, paid
   beyond free tier). Paying a DB floor for a job that doesn't need always-on
   anything. Rejected.
2. **GitHub Actions + SQLite committed to repo** — genuinely $0, no server, but
   requires committing the database (binary blob -> no useful diffs, history
   noise, push/concurrency races). The "commit the db each run" model didn't
   sit right. Rejected.
3. **Basement box + SQLite + cron** — CHOSEN. Marginal cost ~$0 (power/internet
   already paid). State is a local file we control and back up normally.

## Why the basement box wins here
- **$0 marginal cost** on hardware that already runs.
- **No inbound exposure needed.** Posting to Bluesky and scraping the MA site
  are both *outbound* HTTPS — no port-forwarding, no dynamic DNS, no open ports.
- **Clean state handling** — local SQLite file, no binary-in-git, no commit
  noise, no concurrency dance.
- Downtime is low-stakes and self-healing via dedupe.

## Consequences (the tickets this spawns)
- #007 Postgres -> SQLite (data is tiny; single-writer; batch access).
- #008 Drop the Express server; run the scripts directly from cron.
- #009 Decommission Fly/Docker deploy config.

## Note on data migration
We do **not** need to migrate old data. Bills are fully re-scrapable, and moving
off Twitter to a fresh Bluesky account means a fresh post history anyway. A
clean SQLite DB is the correct starting state.

## Note on first run (decided June 2026)
Start as if the app never existed. The first run **seeds** the current page-1
bills as already-handled *without posting them* — only bills that appear after
launch get posted. No backlog drain. See #008 (mechanism) and #004 (schema).
