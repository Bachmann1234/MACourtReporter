# 007 — Data layer: Drizzle + better-sqlite3 (replaces Postgres/TypeORM)

**Status:** TODO
**Area:** persistence / infra
**Size:** M
**Note:** We drop TypeORM entirely here rather than upgrading it.

## Why
Per the [hosting decision](./000-hosting-decision.md), we self-host on the
basement box. The dataset is tiny (a few thousand bill rows per 2-year session
+ post records), single-writer, accessed in short batch runs. Postgres is
overkill (the only thing that wanted to be "always on"), and TypeORM's decorator
+ `reflect-metadata` model is overkill for two tables. We move to **Drizzle ORM
+ better-sqlite3**: lightweight, TypeScript-first, no decorators, real
migrations via `drizzle-kit`.

## Work
- Add `drizzle-orm` + `better-sqlite3`; add `drizzle-kit` (dev). Remove
  `typeorm`, `pg`, and `reflect-metadata`.
- Define Drizzle schema for the two tables:
  - `bill` — incl. `status` (`NEW | POSTED | SKIPPED`) per #004 (replaces the
    join-to-posts model; SKIPPED = seeded).
  - `post` — renamed from `tweet` (#004); real posts only (each row = a real
    Bluesky post with its URI).
- Point the db at a file via `DB_PATH` env (default `./data/macourtreporter.db`).
- Replace `createConnection()`/`getConnection()` in the two scripts
  (`updateBillsInDb.ts`, the posting script) with a shared Drizzle handle module.
- Delete the old TypeORM entities (`src/entity/*`) and migrations
  (`src/migration/*`); author **one initial Drizzle migration** (decided: real
  migration, not push/`synchronize`).
- Ensure `data/` exists and is **gitignored** (local state, not source).

## tsconfig cleanup (rides here)
- Remove `emitDecoratorMetadata` + `experimentalDecorators` (only TypeORM needed
  them).

## Decided
- **Drizzle + better-sqlite3** (over TypeORM, plain better-sqlite3, or Prisma).
- **Real initial migration** via drizzle-kit (keep a schema history).
- **Backups: manual for now** — occasional `sqlite3 .backup` / file copy; data
  is re-scrapable and low-stakes. Revisit if it matters.
- **Clean slate** — no data migration (bills re-scrapable; fresh Bluesky = fresh
  post history; see #000).

## Notes
- `better-sqlite3` is synchronous + fast, a good fit for a batch CLI; confirm it
  builds on the basement box's Node/arch (native addon).

## Open questions
- Exact db file location on the box (set via `DB_PATH`) — settle alongside #008.
