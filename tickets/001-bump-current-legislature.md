# 001 — Bump current legislature to the 194th General Court

**Status:** TODO
**Area:** scraper
**Size:** XS

## Problem
`src/legislature/generalCourt.ts` only knows courts 191 and 192, and
`getCurrentLegislature()` returns 192. As of 2026 the active session is the
**194th General Court (2025–2026)**. Querying court 192 now returns
"No results", so the scraper effectively finds nothing.

## Findings
- The `searchId` is just the hex encoding of the refinement label string.
  Verified:
  - `3139317374202843757272656e7429` -> `"191st (Current)"`
  - `3139326e64202843757272656e7429` -> `"192nd (Current)"`
- Therefore the 194th is `"194th (Current)"` ->
  `3139347468202843757272656e7429` (confirmed live: returns the results table).
- 193rd (`3139337264202843757272656e7429`) returns "No results" — it is not the
  current session.

## Approach (DECIDED): derive from the year, no scraping
The pattern is fully regular, so we compute the current court offline — no need
to hard-code each session or scrape the refiner.

- A new court convenes every 2 years on odd years: 191st=2019, 192nd=2021,
  193rd=2023, 194th=2025. So:
  `courtNumber = 191 + Math.floor((year - 2019) / 2)`  (2026 -> 194 ✓)
- The searchId is `hex("<n><ordinalSuffix(n)> (Current)")`; the st/nd/rd/th
  suffix is computed from the number. Verified against the two known IDs.

## Work
- Implement `getCurrentLegislature()` to derive courtNumber from the current
  year and build the searchId via an `ordinalSuffix()` helper + hex encode.
- Keep a small lookup of historical courts (191–193) is optional; the derived
  path is the source of truth for "current."
- **Zero-results guard:** the only failure mode is a convention change at session
  rollover (the "(Current)" label or cadence). If a scrape returns 0 results,
  log loudly / alert rather than silently posting nothing — that surfaces a
  stale derivation. (Ties into #008 alerting.)

## Rejected
- Live-scraping the general-court refiner to read the "(Current)" option: it's
  an AJAX-loaded modal, more fragile than the verified formula. Not worth it.
