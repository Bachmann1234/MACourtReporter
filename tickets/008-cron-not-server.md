# 008 — Run as a cron job; remove the Express server

**Status:** DONE
**Area:** infra
**Size:** M
**Depends on:** #007 (SQLite, so cron runs need no DB service), #012 (court-scoped
bill identity — the auto-seed logic keys off per-court rows)

## Why
The Express server (`src/scripts/server.ts`) exists only to receive external
POST triggers. On the basement box we don't need an inbound HTTP surface at all
— we just run the two scripts on a schedule. Both scraping and Bluesky posting
are outbound HTTPS, so there's nothing to expose.

## Work
- Remove `src/scripts/server.ts` and the `server` npm script.
- Drop `express` + `@types/express` from dependencies.
- Remove the `API_KEY` guard logic (only the server used it).
- Keep `updateBillsInDb.ts` and the posting script runnable directly as CLIs
  (they already guard on `require.main === module`).
- Document the cron setup on the box, e.g.:
  ```cron
  # update bills hourly, attempt a post every 2 hours
  0 * * * *   cd /path/to/MACourtReporter && /usr/bin/node dist/src/scripts/updateBillsInDb.js >> log 2>&1
  0 */2 * * * cd /path/to/MACourtReporter && /usr/bin/node dist/src/scripts/postBill.js     >> log 2>&1
  ```
- Decide run cadence (how often to scrape; how often / how many to post).
- `.env` on the box holds `BLUESKY_*` creds + `DB_PATH`.

## Seed + session rollover (DECIDED): self-seeding, no manual step
The scraper only reads page 1 (~25 most recent bills). On a fresh DB — and again
at every 2-year session rollover (Jan 2027 = 195th, etc.) — we must NOT post the
existing backlog; only bills that appear *after* we start tracking that session.

Live-site cadence (sampled June 2026, see below) makes this tractable: in steady
state the 194th gains only **~2–4 House bills/day**, so page 1 turns over every
~5–7 days. The only fast churn is a session's filing-deadline day, when thousands
file at once. So two automatic layers, no dates to remember and no manual seed
script:

1. **Auto-seed a brand-new session.** `getCurrentLegislature()` derives the court
   from the date. In `updateBillsInDb`: if the current court has **zero** rows in
   the DB, mark everything the scrape finds as `SKIPPED` (seeded), not `NEW`. This
   unifies the one-time seed and rollover handling — the 194th seeds itself on the
   first run today; every future session seeds itself in January of its year.
   (Requires #012's per-court identity to ask "any rows for this court yet?".)

2. **Flood guard.** A session can trickle a few bills (court row count > 0,
   marked `NEW`) *before* its deadline flood of thousands. So: if a single scrape
   brings in **more than K = 15** previously-unseen bills, mark that batch
   `SKIPPED` and log a warning instead of queueing them to post. In steady state a
   scrape sees 0–1 new bills, so this never trips; a deadline flood = page 1
   entirely new every scrape → all skipped automatically. Safe failure mode is
   "stay quiet," not "spam thousands one-per-run for months."
   - Tradeoff (accepted): if the box is down ~2+ weeks, catch-up could exceed K
     and be wrongly skipped. K = 15 keeps normal multi-day downtime posting its
     backlog; the warning log flags the rare long-downtime case for manual fixup.

After seeding/guarding, the normal post task picks up only genuinely new bills.

## Cadence (DECIDED)
- **Scrape hourly** — overkill for steady state (page 1 barely moves day to day),
  which is the point: ample margin, and no pagination needed for normal operation.
- **Post the single oldest `NEW` bill per run, every 2 hours** (12 slots/day).
  At ~2–4 new/day this keeps up and drains any small backlog. No multi-post burst.
- **Pure cron** — scripts exit; no pm2/systemd service needed.

### Filing-cadence evidence (194th, sampled 2026-06-14)
Earliest action date per House bill, via bill detail pages:
H.1000 & H.3000 = 2/27/2025 (deadline-day flood, thousands at once) · H.4500 =
9/11/2025 · H.5000 = 2/5/2026 · H.5300 = 3/26/2026 · H.5400 = 4/21/2026 · H.5450
= 5/26/2026 · H.5490 = 6/10/2026 · H.5504 (top) = 6/8/2026. → ~2–4 House bills/day
now; the early-session flood is already filed and gets seeded as `SKIPPED`.

## Open questions
- Logging/alerting: plain logfile + logrotate, or notify-on-failure somewhere?
  (The flood-guard + zero-results warnings are the events most worth surfacing.)
- Backups: cron `sqlite3 .backup` / file copy of the db to another location?
- Senate coverage: confirmed a real gap (page 1 is House-only) and split out to
  [#013](./013-senate-coverage.md).
