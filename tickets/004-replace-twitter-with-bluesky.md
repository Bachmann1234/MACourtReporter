# 004 — Replace Twitter posting with Bluesky

**Status:** TODO
**Area:** posting
**Size:** M

## Problem
The Twitter integration is dead twice over:
- The `twit` library is abandoned.
- It calls the v1.1 `statuses/update` endpoint, which Twitter retired (now v2 +
  paid only).

User no longer uses Twitter and wants to post to **Bluesky** instead.

## Scope
Twitter is isolated to a single source file:
- `src/scripts/tweetBill.ts` (the only place `twit` is used)
- `test/scripts/tweetBill.test.ts`
Nothing else imports it. Clean swap point.

## Plan
- Add `@atproto/api` (official AT Protocol client); remove `twit` + `@types/twit`.
- Auth: Bluesky **handle + app password** (created in Bluesky settings — not the
  account password). New env vars `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`,
  replacing the four `TWITTER_*` vars.
- Post flow: `agent.login({ identifier, password })` then
  `agent.post({ text, facets })`.
- Use the `RichText` helper to generate **facets** so the bill URL and `#mapoli`
  render as real links (Bluesky does NOT auto-link plain text).
- Update `.github/workflows/verify.yaml` env block (TWITTER_* -> BLUESKY_*).

## Char limit
Bluesky allows **300 graphemes** (vs 280). Update the length constant in the
renamed `src/entity/Post.ts` (300) — see open question on facet length
accounting and #010 for how the text is composed.

## DB / naming (DECIDED)
- **Rename `Tweet` -> `Post`** (entity + table). Free to do since we start on a
  fresh SQLite DB per #007 — no data to migrate.

## Seed marker (DECIDED: status on Bill)
First-run seeds the current page-1 bills as already-handled *without posting*
(see #008). We represent the bill lifecycle on the **bill**, not with sentinel
post rows:
- Add a `status` to `Bill`: `NEW | POSTED | SKIPPED` (SKIPPED = seeded).
- The seed sets current bills to `SKIPPED`. Normal posting selects the oldest
  `NEW` bill, posts it, sets it `POSTED`, and writes a `Post` row.
- Keeps the `post` table **pure**: every row is a real Bluesky post with a real
  URI. "Has it been posted" is authoritative on the bill, not derived from a
  join to fake rows.

## Decided
- **Rename to `Post`** (above).
- **Keep `#mapoli`.** No added mention/starter-pack tag.
- **Bluesky only** — no cross-posting (Mastodon etc.).
- **Post text composition is split out into its own ticket** — see
  [#010](./010-post-composition.md) (tweak deterministic formatting vs. have
  Haiku summarize).

## Open questions (for discussion)
1. Length accounting — graphemes vs JS string length; the URL facet uses the
   full URL length. Need to recompute the truncation math (now in `Post`).
   *(Tightly related to #010 — the composition strategy determines the math.)*
