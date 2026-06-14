# 010 — Post text composition: deterministic vs. Haiku summary

**Status:** DONE (decided: A)
**Area:** posting
**Size:** S (deterministic) / M (LLM)
**Related:** #004 (posting), #003 (summary now = official bill title)

## Question
How do we turn a bill into post text? Two approaches:

### A. Tweak the existing deterministic formatting
Current logic (in `Tweet.fromBill`, becoming `Post`):
`"<filedBy> filed: <billNumber> - <summary> <url> #mapoli"`, hard-truncated
with `...` to fit. After #003 the `<summary>` is the **official bill title**.
- Pros: accurate (it's the government's own words), zero dependencies, free,
  deterministic, no failure mode, trivial to test.
- Cons: titles are long + bureaucratic; hard truncation reads poorly
  ("An Act relative to the... #mapoli").

### B. Have Haiku summarize the bill into a post
Use Claude Haiku (claude-haiku-4-5) to write a tight, plain-English post.
- Pros: more readable/engaging; smart shortening instead of mid-word cuts; could
  use the richer bill text, not just the title.
- Cons: **fidelity risk** — this is a civic/government bot; an LLM paraphrase can
  subtly misrepresent legislation (the official title is a safer source of
  truth). Adds an API dependency, cost (small), nondeterminism, and a failure
  mode (API down -> need a deterministic fallback anyway). Harder to test.

## Lean
Start with **A** (deterministic), ship the revival, then evaluate **B** as an
enhancement. If we do B, keep A as the guaranteed fallback and consider
constraining Haiku to *compress the official title* (not reinterpret the bill)
to limit hallucination, and/or always include the bill URL so readers can verify.

## Notes
- Composition strategy drives the length/truncation math (open question in #004):
  deterministic = we control the budget; Haiku = we instruct a grapheme limit
  and still need to verify + fall back if it overruns 300.
- Possible future input: the bill detail page (`/Bills/194/<id>`) may have an
  official summary richer than the title — would need extra scraping. Out of
  scope for now; note for B.

## Decision
- [x] A (deterministic) — **chosen (June 2026).** For a civic bot the official
  bill title is the safer source of truth; deterministic, free, no failure mode.
  `MAX_POST_LENGTH` bumped 280 -> 300 for Bluesky.
- [ ] B (Haiku) — _enhancement, revisit after revival; keep A as the guaranteed
  fallback and constrain Haiku to compress the title, not reinterpret the bill._
