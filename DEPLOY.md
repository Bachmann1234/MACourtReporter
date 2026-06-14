# Deploying MACourtReporter (the basement box)

This is a periodic batch job, not a service. Two scripts run from cron:
`updateBills` (scrape malegislature.gov into SQLite) and `postBill` (post the
oldest un-posted bill to Bluesky). No container, no server, no managed DB. See
[ticket 008](./tickets/008-cron-not-server.md) for the rationale.

## 1. Create the Bluesky bot account

1. Sign up at <https://bsky.app> and pick the bot's handle.
2. Settings → **Privacy & Security → App Passwords → Add App Password**. Copy it.
   - This is the value for `BLUESKY_APP_PASSWORD`. It is **not** the account
     password — the code logs in with handle + app password and will only ever
     need this one.
3. (Optional) Set the profile avatar/header from `avatar/profile.png` and
   `avatar/background.png` in this repo.

## 2. Box prerequisites

- **Node 22.x** (`package.json` pins `engines.node` to `22.x`). Confirm with
  `node -v`, and note the absolute path (`which node`) — the crontab needs it.
- `git`, and a C toolchain for `better-sqlite3`'s native build (usually already
  present; `build-essential` / Xcode CLT if not).
- (Optional) `sqlite3` CLI — handy for the smoke test and for inspecting the DB.

## 3. Install

```sh
git clone git@github.com:Bachmann1234/MACourtReporter.git
cd MACourtReporter
npm ci
npm run build
```

Create `.env` in the repo root (it is gitignored):

```sh
BLUESKY_HANDLE=yourbot.bsky.social
BLUESKY_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
# Optional. Defaults to ./data/macourtreporter.db if omitted.
DB_PATH=/home/you/MACourtReporter/data/macourtreporter.db
```

Create the database / apply migrations:

```sh
npm run db:migrate
```

## 4. Seed the current session

The first scrape auto-seeds: because the current court (the 194th) has no rows
yet, **everything found is marked `SKIPPED`** so the existing backlog never
posts. Only bills filed *after* this run will be posted.

```sh
npm run updateBills
```

You should see a log line like `Court 194 has no rows yet; seeding N bills as
SKIPPED.` This is also what happens automatically at every 2-year session
rollover (Jan 2027 = 195th, etc.) — no manual step is ever needed again.

A separate **flood guard** covers a session's filing-deadline surge: if any one
scrape brings in more than 15 previously-unseen bills, the batch is marked
`SKIPPED` with a `WARN` instead of queued. Watch the logs for that warning.

## 5. Smoke-test one real post (do this before trusting cron)

Confirm the Bluesky path end-to-end without waiting for a genuinely-new bill.
Flip one seeded bill to `NEW`, then run the post task once:

```sh
# pick any seeded bill and mark it NEW (uses $DB_PATH from .env, or the default)
sqlite3 data/macourtreporter.db \
  "UPDATE bill SET status='NEW' WHERE id=(SELECT id FROM bill WHERE status='SKIPPED' LIMIT 1);"

npm run postBill
```

Verify on the bot's Bluesky profile that the post appears and that the bill URL
and `#mapoli` render as real links (the code runs the text through RichText to
detect those facets). `postBill` marks the bill `POSTED` and records the post
row, so it won't double-post.

## 6. Install cron

Run `crontab -e` and add (substitute the real repo path and `node` path from
step 2):

```cron
# scrape hourly, post the single oldest NEW bill every 2 hours
0 *   * * *  cd /home/you/MACourtReporter && /usr/bin/node dist/src/scripts/updateBillsInDb.js >> ~/macourtreporter.log 2>&1
0 */2 * * *  cd /home/you/MACourtReporter && /usr/bin/node dist/src/scripts/postBill.js        >> ~/macourtreporter.log 2>&1
```

- Scraping hourly is deliberate overkill — page 1 of the site barely moves, so
  there's ample margin and no pagination is ever needed.
- Posting drains one bill every 2 hours (12/day), which keeps up with the ~2–4
  new bills/day the 194th files in steady state.
- The scripts read `.env` via `dotenv`, so cron's bare environment is fine as
  long as `.env` lives in the repo root (the `cd` ensures it's found).

## 7. Operating notes

- **Logs:** everything goes to `~/macourtreporter.log`. The events most worth
  watching are the flood-guard warning and zero-results warnings. Add logrotate
  if it grows.
- **Backups:** the SQLite file under `data/` is re-scrapable local state, so
  backups are optional — an occasional `sqlite3 data/macourtreporter.db ".backup
  /path/to/backup.db"` or file copy is enough.
- **Upgrades:** `git pull && npm ci && npm run build`. Re-run `npm run db:migrate`
  if new migrations landed under `drizzle/`.

## Known gap

The bot does **not** post Senate bills: the site search sorts by bill number
descending and House numbers dwarf Senate, so the page-1 scrape is House-only.
Confirmed and tracked in [ticket 013](./tickets/013-senate-coverage.md).
