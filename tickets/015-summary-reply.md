# 015 — Value-gated plain-English summary reply

**Status:** DONE (implemented June 2026, branch `summary-reply`)
**Area:** posting
**Size:** M
**Related:** #010 (post composition — this is the deferred "B", reshaped), #004 (Bluesky posting), #003 (main-post summary = official title), #014 (alerting — reuse the "never let a side-effect crash the job" discipline)

## Why
The main post is the bill's **official title** (decided in #010 — the government's
own words, safe source of truth). That's the right call for the headline, but
titles are often long, bureaucratic, or opaque, and the existing `...` hard-
truncation drops real substance. Worked examples from the June 2026 spike on the
live site:

- **H.5504** — title truncates at "...for highway purpo..."; the actual deal (the
  state must pay Hingham ≥110% of fair market value into a conservation fund, plus
  transfer ~8 acres to the conservation commission) is **only in the bill text**,
  invisible in the post.
- **S.3117** — "An Act to authorize the town of North Andover to ban SGARs and
  FGARS." The acronyms (first/second-generation anticoagulant rodenticides) are
  unreadable to a layperson.

So: add a **threaded reply** that explains, in plain English, what the bill would
actually do — but **only when it adds value over the title.** A redundant summary
("a sick leave bank for a named employee" under a title that already says exactly
that) is just noise; a bit of explanation where the title hides the substance is
genuinely useful. The bot judges which case it's in.

## Design (DECIDED)

### Reply, not rewrite — fidelity is preserved by construction
The main post is unchanged (deterministic, official title, source of truth). The
LLM output is **additive context in a reply**, with the bill URL already in the
parent for verification. This is what makes it safe where #010's "B" (LLM writes
the *main* post) was not: a flawed summary sits next to, not in place of, the
authoritative headline.

### The model reads the full bill text, not just the title
Fetch the bill body from the existing site:
`…/Bills/194/<id>/<Chamber>/Bill/Text` (same host/markup the scraper already
parses with Cheerio). Strip the trailing site boilerplate ("The information
contained in this website…") and the leading `× Bill <num>` chrome. The summaries
in testing cited facts (the 110% figure, the conservation fund, the ~8 acre
transfer) verified to come from this text and nowhere in the title — confirming
the model is summarizing the legislation, not paraphrasing the headline.

### Value gate (the judgment step)
One model call does **decide-then-write**: it returns whether a reply is
warranted and, if so, the summary text. Reply only if at least one holds:
- the title is vague / generic / procedural and doesn't convey what the bill does;
- the title was likely truncated in the main post, hiding substance;
- the real effect / mechanism / stakes (dollar terms, who's affected, notable
  conditions, undefined jargon) aren't obvious from the title alone.

Skip when the title already tells a layperson what the bill does. Skipping is
expected to be common — on a 7-bill test sample the gate replied to 4, skipped 3
(budget, bridge-naming, named-employee sick-leave bank all correctly skipped).

### Model: Claude Sonnet 4.6 (`claude-sonnet-4-6`)
Sonnet over Haiku: on the test bills it reliably caught one extra true detail
(the MassDOT marker requirement, "includes licensed pest-control companies", the
reporting deadline) and was marginally more accurate. At this volume the cost
delta is rounding error, and the bot's whole value is being trustworthy, so pay
for the better model. Haiku (`claude-haiku-4-5`) is a drop-in cheaper fallback if
cost ever matters. Use adaptive thinking; constrain output to ≤300 graphemes and
verify length before posting (same 300 budget as the main post).

**Cost:** ~$0.005 per posted bill (one call: ~1k input tokens of instructions +
bill text, ~120 output). At realistic throughput (a few genuinely-new bills/day,
backlog already seeded SKIPPED, flood-guard skipping surge batches) that's roughly
**$5–15/year**. A SKIP is marginally cheaper (tiny output) but still one call.

## Work
- **Dependency:** add `@anthropic-ai/sdk`. New env var `ANTHROPIC_API_KEY`
  (optional → feature off if unset, so CI/local/tests are unaffected, mirroring
  #014's env-gating convention). Document in README operating notes, DEPLOY.md,
  and the `.env` example.
- **Bill-text fetch:** extend `src/clients/malegislature.ts` with a function to
  GET the `/Bill/Text` page for a bill and return cleaned body text (strip the
  boilerplate + `× Bill` chrome). Reuse the existing fetch + Cheerio setup.
- **Summarizer module** (`src/posts/summarizeBill.ts` or similar): one call,
  decide-then-write, returns `{ reply: false } | { reply: true, text }`. Enforce
  the ≤300 grapheme cap; if the model overruns, drop the reply rather than post an
  over-length or truncated one. **Best-effort: any failure (API down, timeout,
  malformed output, text-fetch fails) must fall through to "no reply" and never
  block or crash the main post.** Wrap in try/catch with `AbortSignal.timeout`.
- **Threaded posting** in `src/scripts/postBill.ts`: after the main post succeeds,
  if the gate said reply, post the summary as a reply. AtProto replies need
  `root` + `parent` refs of **both `uri` and `cid`** — the current flow only
  captures `uri` from the main post, so capture `cid` too.
- **Persistence:** the reply is a second Bluesky post for the same bill. The
  `posts` table has a **`bill_id` UNIQUE** constraint (one post per bill), which
  blocks a second row as-is. Decide: store the reply's uri/text on the same row
  (e.g. `reply_uri` / `reply_text` columns) vs. relax the constraint and add a
  row kind. Leaning add columns — keeps "one row per bill" and is a smaller
  migration. Requires a Drizzle migration.
- **Tests:** gate decision parsing (REPLY vs SKIP), length-cap enforcement,
  graceful degradation on summarizer failure (main post still goes out, no reply),
  text-cleaning (boilerplate stripped), and the threaded-reply ref plumbing
  (uri+cid). Unset-`ANTHROPIC_API_KEY` is the default so existing suites stay green.

## Open questions
- **Large-bill text gap:** for big bills (e.g. the FY2027 budget) the `/Bill/Text`
  endpoint returns only the standard preamble, not the appropriations — so the
  model has *less* than the title. In testing it correctly declined to invent
  specifics and the gate SKIPped. Confirm that's the desired behavior (skip vs. a
  "see full text" note) and that the gate reliably skips when text is just
  boilerplate.
- **Gate aggressiveness:** ~55% reply rate on the test sample. Tunable via the
  rule wording. Lean toward *less* noise per the decision to do this — revisit
  after watching real output.
- **Grounding / trust:** read accurately in testing, but an LLM summarizing legal
  text can still misstate a number or condition. The bill URL in the parent post
  is the verification path; consider whether the reply should carry any explicit
  "summary — see bill" framing, and/or a periodic spot-check of live replies.
- **Backfill:** none. Feature applies to bills posted after it ships; no retro
  replies to existing posts.

## Implementation notes (as built)
- **Bill text:** `extractBillText` (pure) + `fetchBillText` in
  `src/clients/malegislature.ts`; chamber derived from the bill-number prefix.
- **Summarizer:** `src/posts/summarizeBill.ts`. `summarizeBill(bill, text, client)`
  is the inner call (decide-then-write); `maybeBuildReply(bill)` is the
  best-effort entry the poster uses — off unless `ANTHROPIC_API_KEY` is set, never
  throws, enforces the ≤300 cap. `SUMMARY_MODEL` env overrides the Sonnet default.
- **Decision transport:** used **structured outputs** (`output_config.format` JSON
  schema) for a reliably-parseable decision. *Deviation from the spec's "use
  adaptive thinking":* dropped explicit thinking — for this bounded
  classify-then-write task it adds latency/cost/failure surface without a quality
  need, and structured output already guarantees a clean parse. Easy to revisit.
- **Posting:** `postBill.ts` logs in once, captures `uri`+`cid`, posts the reply
  threaded (`root`/`parent` = main post). Reply path fully guarded — a reply
  failure logs and leaves the main post + `POSTED` status intact.
- **Schema:** added `reply_uri` / `reply_text` to `post` (migration
  `0001_post_reply_columns`), keeping one row per bill.
- **Tests:** text extraction/fetch, gate parsing + cap + malformed-output
  degradation, env-off / fetch-fail / api-fail graceful paths, and the threaded
  reply + persistence + reply-failure-doesn't-undo-main-post in `postBill`.
  Full suite green (45 tests); `ANTHROPIC_API_KEY` unset by default so CI/local
  are unaffected.
- **Not yet done:** live end-to-end against the real API (the dev box has no
  usable public API key) — verify on the box after setting `ANTHROPIC_API_KEY`.
  Docs updated (README, DEPLOY `.env`).
