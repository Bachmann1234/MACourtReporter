# MACourtReporter

Reports on the activities of the Massachusetts General Court. Scrapes bills from
malegislature.gov and posts them to social media.

## Status: reviving (June 2026)

This repo was dormant for ~4 years and is being revived. The work is planned as
numbered tickets in [`tickets/`](./tickets), with [`tickets/README.md`](./tickets/README.md)
as the index and source of truth.

**Roadmap is organized into phases.** When asked to "do phase N", read
`tickets/README.md`, then execute the tickets listed under that phase, in the
order shown — checking each ticket's **Decided** and **Open questions** sections
before starting.

Phases at a glance:
1. **Foundation** — toolchain (Biome + Vitest), Node bump.
2. **Scraper green** — cert removal, derive current legislature, summary fix.
3. **Data layer** — Drizzle + better-sqlite3 (replaces TypeORM/Postgres).
4. **Posting** — Twitter -> Bluesky, post-text composition.
5. **Deploy** — cron on a self-hosted box, decommission Fly.

Key locked decisions: self-host on a basement box (SQLite + cron, no always-on
server/DB); fresh start (seed current bills as SKIPPED, only post genuinely new
ones); Drizzle over TypeORM; Bluesky only (no cross-posting).
