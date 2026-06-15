# Tickets

> **Status: revival complete (June 2026); tickets #001–#013 are `DONE`.** The bot
> is operating, so this directory is now mostly a design record.
> [#015 — value-gated summary reply](./015-summary-reply.md) is implemented
> (branch `summary-reply`); [#014 — failure alerting](./014-failure-alerting.md)
> remains open, deferred until the bot is actually running on the box. New work
> should get its own ticket appended below.

Tracking the work to revive MACourtReporter after its ~4-year dormancy.

These came out of a June 2026 assessment of the scraper against the live
`malegislature.gov` site and the (now dead) Twitter integration.

## Phases (build order)
Work proceeds in numbered phases. "Phase N" refers to the entries below.
Foundation goes upfront (pure tooling, no behavior change), then the functional
work is sequenced so each phase builds on green tooling. Within a phase, do the
listed tickets in the order shown.

- **Phase 1 — Foundation:** [011](./011-toolchain-modernization.md) (Biome
  replaces ESLint+Prettier; Vitest replaces Jest+ts-jest; version bumps; tsconfig
  `target`) + [005](./005-upgrade-node-runtime.md) (Node 18 -> LTS).
- **Phase 2 — Scraper green:** [002](./002-remove-cert-workaround.md) ->
  [001](./001-bump-current-legislature.md) ->
  [003](./003-fix-summary-extraction.md) (fold axios->fetch in here).
- **Phase 3 — Data layer:** [007](./007-postgres-to-sqlite.md) — Drizzle +
  better-sqlite3 (carries the `Post` rename + `Bill.status` from 004;
  decorators/reflect-metadata come out here).
- **Phase 4 — Posting:** [004](./004-replace-twitter-with-bluesky.md) +
  [010](./010-post-composition.md). *(DONE)*
- **Phase 5 — Deploy:** [012](./012-court-scoped-bill-identity.md) ->
  [008](./008-cron-not-server.md) ([009](./009-decommission-fly.md) already DONE).
  012 (per-court bill identity) goes first — 008's auto-seed/rollover logic
  depends on it. *(DONE)*

Coupled dependency removals ride with their feature ticket (decorators with 007,
`twit` with 004, `express` with 008) — removing them upfront would break the
build.

### Picking up in a fresh session
"Let's do phase one" (etc.) means: read this file, execute the tickets listed
under that phase, in order. Check each ticket for its **Decided** and **Open
questions** sections before starting. Honor `/Users/.../CLAUDE.md` (e.g. use a
virtualenv for any Python).

## Scraper revival (small, high-confidence)
- [001 — Bump current legislature to the 194th General Court](./001-bump-current-legislature.md)
- [002 — Remove obsolete cert workaround](./002-remove-cert-workaround.md)
- [003 — Fix summary extraction (title only)](./003-fix-summary-extraction.md)

## Twitter -> Bluesky
- [004 — Replace Twitter posting with Bluesky](./004-replace-twitter-with-bluesky.md)
- [010 — Post text composition: deterministic vs. Haiku summary](./010-post-composition.md)
- [015 — Value-gated plain-English summary reply](./015-summary-reply.md) — `DONE`

## Hosting / infra
**Decision (June 2026): self-host on the basement box.** See
[the decision record](./000-hosting-decision.md). This workload is a periodic
batch job, not a 24/7 service, so we drop the always-on server + Postgres in
favor of a local SQLite file driven by cron.
- [007 — Switch persistence Postgres -> SQLite](./007-postgres-to-sqlite.md)
- [008 — Run as a cron job; remove the Express server](./008-cron-not-server.md)
- [009 — Decommission Fly / Docker deploy config](./009-decommission-fly.md)
- [014 — Failure alerting (ntfy + Healthchecks dead-man's-switch)](./014-failure-alerting.md) — `TODO`, deferred until deployed

## Data layer
- [012 — Court-scope bill identity (fix cross-session collision)](./012-court-scoped-bill-identity.md)

## Scraper coverage
- [013 — Senate coverage (page 1 is House-only)](./013-senate-coverage.md) — `DONE`

## Toolchain / hygiene
- [011 — Toolchain modernization: Biome + Vitest + tsconfig](./011-toolchain-modernization.md)
- [005 — Node 18 is EOL; upgrade runtime](./005-upgrade-node-runtime.md)

## Status legend
`TODO` · `IN PROGRESS` · `BLOCKED` · `DONE`
