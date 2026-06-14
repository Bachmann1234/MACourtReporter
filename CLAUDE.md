# MACourtReporter

Reports on the activities of the Massachusetts General Court. Scrapes bills from
malegislature.gov and posts them to social media.

## Status: revived (June 2026) — operating

This repo was dormant for ~4 years and has been revived; all of the planned
tickets in [`tickets/`](./tickets) are `DONE` and it now runs as a cron job on
the basement box (see [DEPLOY.md](./DEPLOY.md)). [`tickets/README.md`](./tickets/README.md)
remains the index and design record; new work should get a new ticket.

**The phase roadmap below is historical** — it records how the revival was
sequenced and is kept for context. There is no outstanding phase work; "do phase
N" no longer applies.

Phases at a glance:
1. **Foundation** — toolchain (Biome + Vitest), Node bump.
2. **Scraper green** — cert removal, derive current legislature, summary fix.
3. **Data layer** — Drizzle + better-sqlite3 (replaces TypeORM/Postgres).
4. **Posting** — Twitter -> Bluesky, post-text composition.
5. **Deploy** — cron on a self-hosted box, decommission Fly.

Key locked decisions: self-host on a basement box (SQLite + cron, no always-on
server/DB); fresh start (seed current bills as SKIPPED, only post genuinely new
ones); Drizzle over TypeORM; Bluesky only (no cross-posting).
