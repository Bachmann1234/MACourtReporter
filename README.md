# MACourtReporter

Reports on the activities of the Massachusetts General Court

This is an idea im exploring to attempt two things.

1. Learn a bit more about state and local government
2. Get some practice with Typescript

My initial idea is to attempt to track bills brought up and post them via a twitter bot account.

I don't really have much of an agenda here. If I have any political agenda with this project its that we would all be better served to spend more of our attention focused on state and local government.

# Running it

This is a periodic batch job, not an always-on service. It runs on a self-hosted
box (the "basement box") driven by cron — no container, no hosted server, no
managed database.

State lives in a local SQLite file (via Drizzle + better-sqlite3). Point at it
with `DB_PATH` (default `./data/macourtreporter.db`).

```sh
npm ci
npm run build
npm run db:migrate   # apply migrations / create the SQLite file
npm run updateBills  # scrape malegislature.gov into the db
npm run tweetBill    # post the oldest un-posted bill
```

`updateBills` and `tweetBill` are the two cron entry points. The SQLite file is
local state (gitignored under `data/`) and is re-scrapable, so backups are
manual for now — an occasional file copy is enough.

# Social Media Avatars

These represent the bots identity!

![profile image](./avatar/profile.png)
![background](./avatar/background.png)

These social media were created on commission by [Winnie Gong](https://github.com/bossibly)
