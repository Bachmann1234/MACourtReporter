# 012 — Court-scope bill identity (fix cross-session collision)

**Status:** DONE
**Area:** data layer
**Size:** S
**Blocks:** #008 (auto-seed on session rollover needs per-court identity)

## Problem (latent bug)
Bill numbers restart every General Court — the 195th will have its own `H.1`,
`H.2`, … just like the 194th. Today the `bills` table identifies a bill by
`billNumber` alone:

- `schema.ts`: `uniqueIndex('bill_number_idx').on(table.billNumber)`
- `updateBillsInDb.findNewBills`: dedupes on `billNumber` only.

So at the next session rollover (Jan 2027, the 195th), every overlapping number
(`H.1`…`H.5504`) is seen as "already exists" → the new session's bills are
**silently never ingested → never posted.** The bot goes quiet on those numbers
forever. (The unique index would also reject them on insert.)

## Fix
- Add `courtNumber` (integer, not null) to `bills`.
- Replace the unique index with a composite `(courtNumber, billNumber)`.
- `updateBillsInDb`: stamp the current `getCurrentLegislature().courtNumber` on
  inserted rows, and dedupe on `(courtNumber, billNumber)` — only treat a bill as
  seen if we've seen it *for this court*.
- Fresh SQLite DB (per #007) → no data migration; regenerate the Drizzle
  migration.

## Notes
- This is a prerequisite for #008's "auto-seed any brand-new session" logic,
  which keys off "do we have any rows for this court yet?".
