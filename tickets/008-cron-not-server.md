# 008 — Run as a cron job; remove the Express server

**Status:** TODO
**Area:** infra
**Size:** M
**Depends on:** #007 (SQLite, so cron runs need no DB service)

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

## First-run behavior (DECIDED): seed silently, then post new
Fresh empty DB. The scraper only reads page 1 (~25 most recent bills), and we do
NOT want to post those on launch — only bills that appear *after* launch.

- Provide a one-time **seed step**: scrape page 1 and record every current bill
  as already-handled WITHOUT posting it. Implementation options (decide in #004
  since it touches the Post entity):
  - mark each seeded `Bill` as handled (e.g. a `posted`/`seeded` flag), or
  - create a sentinel Post row per seeded bill (flagged `seeded: true` so it's
    distinguishable from a real post).
- After seeding, the normal post task picks up only genuinely new bills.
- Cadence still open: one bill per run? Since we're not draining a backlog, a
  simple "post the single oldest un-posted bill per run" is fine.

## Open questions
- Cadence: confirm "one oldest un-posted bill per run" + how often cron fires.
- Logging/alerting: plain logfile + logrotate, or notify-on-failure somewhere?
- Backups: cron `sqlite3 .backup` / file copy of the db to another location?
- Process manager: pure cron is enough (scripts exit); no need for pm2/systemd
  service since there's no long-running process. Confirm.
