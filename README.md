# MACourtReporter

Reports on the activities of the Massachusetts General Court.

It scrapes newly-filed bills from [malegislature.gov](https://malegislature.gov)
and posts them to a [Bluesky](https://bsky.app) bot account. It started as a way
to learn a bit more about state and local government and get some practice with
TypeScript.

I don't really have much of an agenda here. If I have any political agenda with this project its that we would all be better served to spend more of our attention focused on state and local government.

# Running it

This is a periodic batch job, not an always-on service. It runs on a self-hosted
box (the "basement box") driven by cron — no container, no hosted server, no
managed database.

State lives in a local SQLite file (via Drizzle + better-sqlite3). Point at it
with `DB_PATH` (default `./data/macourtreporter.db`). Bluesky credentials come
from the environment too — `BLUESKY_HANDLE` and `BLUESKY_APP_PASSWORD` (an app
password from Bluesky settings, not the account password). All of these live in
a `.env` on the box.

```sh
npm ci
npm run build
npm run db:migrate   # apply migrations / create the SQLite file
npm run updateBills  # scrape malegislature.gov into the db
npm run postBill     # post the oldest un-posted bill to Bluesky
```

`updateBills` and `postBill` are the two cron entry points; both are plain
scripts that exit when done (no long-running server). The SQLite file is local
state (gitignored under `data/`) and is re-scrapable, so backups are manual for
now — an occasional file copy is enough.

For end-to-end box setup (Bluesky account, `.env`, seeding, smoke test, cron),
see [DEPLOY.md](./DEPLOY.md).

## Cron setup on the box

```cron
# scrape hourly, post the single oldest NEW bill every 2 hours
0 *   * * *  cd /path/to/MACourtReporter && /usr/bin/node dist/src/scripts/updateBillsInDb.js >> ~/macourtreporter.log 2>&1
0 */2 * * *  cd /path/to/MACourtReporter && /usr/bin/node dist/src/scripts/postBill.js        >> ~/macourtreporter.log 2>&1
```

Scraping hourly is deliberate overkill — page 1 of the site barely moves day to
day, so this leaves ample margin and never needs pagination. Posting drains one
bill every 2 hours (12/day), which keeps up with the ~2–4 new bills/day the
194th files in steady state.

**Seeding is automatic — there's no manual seed step.** On a fresh DB (and again
at every 2-year session rollover) the first scrape finds the *current* session
with zero rows, so it marks the whole backlog `SKIPPED` rather than posting it;
only bills that appear afterward get posted. A separate flood guard catches a
session's filing-deadline surge: if one scrape brings in more than 15 unseen
bills it skips the batch and logs a warning instead of queueing thousands of
posts. See [ticket 008](./tickets/008-cron-not-server.md) for the full rationale.

# Social Media Avatars

These represent the bots identity!

![profile image](./avatar/profile.png)
![background](./avatar/background.png)

These social media were created on commission by [Winnie Gong](https://github.com/bossibly)
