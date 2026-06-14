# 013 — Senate coverage (page 1 is House-only)

**Status:** DONE
**Area:** scraper
**Size:** M
**Depends on:** #012 (per-court identity — the merged scrape still keys off
`(courtNumber, billNumber)`)

## Problem (confirmed bug)
`queryRecentBills` (`src/clients/malegislature.ts`) reads **only page 1** of a
single search spanning both chambers, sorted by:

```
SortManagedProperty=lawsbillnumber&Direction=desc
```

That sort orders by the numeric part of the bill number across both chambers,
and the House files far more bills than the Senate (this session: House ≈ H.5500,
Senate ≈ S.2700). So the Senate's highest numbers never climb high enough to
reach page 1 — and we never read page 2.

**Verified live (2026-06-14)** against the 194th search URL the bot actually
uses: page 1 was 25 rows, every one a House bill (`H.5504` down to `H.5479`), no
Senate bill anywhere on it. This is structural, not a fluke: **the bot would
never post a single Senate bill for the entire session.**

Secondary observation: bill-number-desc is only a rough proxy for "recent" —
it's really "highest House number," not "most recently filed." The Senate
blackout is the concrete bug to fix here; true date-ordering is a nice-to-have
(see Alternatives).

## Plan (preferred): two scrapes, merged
- Find the search URL refinement that restricts results to a single chamber
  (House vs. Senate) — inspect the refinement panel on the live search page to
  confirm the exact param name/value. **First step of the implementing session.**
- Run `queryRecentBills` once per chamber (page 1 each) and merge the results
  before returning, so callers see a combined recent set.
- No change needed to `updateBillsInDb`'s seed / flood-guard / dedupe logic: it
  already keys off per-court row counts and `(courtNumber, billNumber)` identity
  (#012), so a merged list flows through unchanged.
- Flood-guard note: the threshold (K = 15) currently assumes one chamber's
  steady-state trickle. Merging two chambers roughly doubles the steady-state
  per-scrape count — re-check K so a normal merged scrape doesn't trip it.

## Alternatives (considered)
- **Sort by filing/action date instead of bill number.** Gives true recency and
  naturally interleaves chambers, but only works if the site exposes a date
  managed property to `SortManagedProperty`, and you'd likely still want a
  per-chamber sanity check. More invasive; defer unless the chamber refinement
  turns out not to exist.
- **Read page 2+.** Doesn't help — Senate is below *all* House bills in the
  ordering, not just below page 1.

## Resolution (2026-06-14)
- **Chamber-refinement param:** `Refinements[lawsbranchname]`, value = hex of the
  chamber label (same scheme as `lawsgeneralcourt`): House=`486f757365`,
  Senate=`53656e617465`. Verified live: Senate-refined page 1 returns S.3120↓.
- `queryRecentBills` now scrapes each chamber's page 1 (`queryRecentBillsForChamber`)
  and merges; `updateBillsInDb` is unchanged (per-court dedupe already handles it).
- **Flood guard K:** left at 15. Merged steady state is ~0–2 new bills/run, far
  below the threshold; only the comment was updated.

## Open questions
- Post cadence: at ~2–4 House/day plus Senate, is one post / 2h still enough to
  keep up, or does the oldest-NEW queue slowly grow? Worth a glance once live.
