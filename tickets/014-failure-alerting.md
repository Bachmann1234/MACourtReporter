# 014 — Failure alerting (ntfy push + Healthchecks dead-man's-switch)

**Status:** TODO
**Area:** infra / ops
**Size:** S
**Depends on:** nothing in code; **blocked on the bot actually running on the box**
(do this as a follow-up once it's deployed — no point wiring alert channels at
something that isn't live yet).

Supersedes the "logging/alerting" open question in
[#008](./008-cron-not-server.md).

## Why
On the basement box the bot is two cron scripts that run and exit — there's no
always-on process to watch itself, and everything currently goes to a logfile
nobody reads. Two failure modes go completely unnoticed today:

1. **Loud failure** — a script throws (network error, `malegislature.gov` markup
   change tripping `validatePotentialBill`, Bluesky auth failing) or the box/cron
   is down. Today both entry points do `.catch((error) => logger.error(error))`
   and **exit 0**, so even a crash looks like success.
2. **Silent success that does nothing** — the insidious one. At a session
   rollover the `"(Current)"` derivation can go stale → the scrape returns zero
   results, logs a `WARN`, and exits 0. The bot quietly posts nothing for weeks
   and you'd never know. The flood-guard trip is a milder version (skips a batch,
   logs a `WARN`).

## Design (DECIDED): two independent channels
Mapped onto the two failure shapes:

- **ntfy.sh — outbound push = "the app is unhappy."** The box is alive and pushes
  a notification itself. Fires on: zero-results scrape (stale-derivation suspect),
  flood-guard trip, and any uncaught exception. Just a `POST` to a topic URL — no
  account, phone app for delivery.
- **Healthchecks.io — dead-man's-switch = "is the cron firing and completing."**
  Catches box-down, cron misconfigured, and a script that hangs/crashes before
  finishing — none of which the box can report itself. The script pings a unique
  URL on success; on a thrown error it pings `…/fail` for an immediate alert. If
  an expected ping never arrives within the period+grace, Healthchecks alerts.

**The two signals must stay independent.** A zero-results scrape still
*completed*, so it pings Healthchecks **success** (cron is healthy) **and** fires
ntfy (a human should look). Conflating them would either suppress the ntfy or
falsely fail the heartbeat.

**One Healthchecks check per cron job** — separate ping URLs for `updateBills`
(hourly) and `postBill` (every 2h), so each is verified independently. `postBill`
legitimately does nothing when the queue is empty, but it still *completed*, so it
should ping success regardless of whether it posted.

## Work (all in-code, no new infra to run)
- Stop swallowing errors: the `require.main === module` blocks set
  `process.exitCode = 1` on failure instead of just logging.
- Small best-effort `src/alerts/` module:
  - `notify(message)` → `POST` to `NTFY_URL` (no-op if unset).
  - `heartbeat(baseUrl, 'success' | 'fail')` → ping Healthchecks (no-op if unset).
  - Both wrap `fetch` in try/catch with an `AbortSignal.timeout` — **an alerting
    failure must never crash the job it's reporting on**, and must not hang cron.
  - A thin `runCron(task, healthcheckUrl)` glue: run → success heartbeat; on throw
    → log + `notify` + `fail` heartbeat + `exitCode = 1`.
- Wire the semantic alerts where they're detected, in `updateBillsInDb`:
  zero-results (both chambers empty) and flood-guard trip both call `notify`.
- Env vars (all optional; unset = feature off, so tests/CI/local runs are
  unaffected): `NTFY_URL`, `HEALTHCHECK_URL_UPDATEBILLS`, `HEALTHCHECK_URL_POSTBILL`.
  Document in README "Operating notes", DEPLOY.md, and the `.env` example.
- Tests: `notify`/`heartbeat` no-op without env and post with it (mock `fetch`),
  swallow fetch errors, and `…/fail` URL on failure. Unset-env is the default so
  existing suites stay green.

## Why not the cheaper options (context from the design discussion)
- **In-code-only, no Healthchecks:** covers modes 1–2 *while the box is alive*,
  but cannot detect the box/cron being fully dead — detecting absence needs
  something alive when the box isn't. That's irreducible.
- **GitHub Actions as the watcher** (scheduled job checking the public Bluesky
  feed): rejected — GitHub auto-disables scheduled workflows after 60 days of repo
  inactivity, so the monitor would silently die exactly when the project goes
  quiet in steady state.
- **Box-down detection therefore needs one external thing**: either a second
  always-on device you already own (NAS/Pi/router running the watcher) or a free
  SaaS switch. Healthchecks.io free tier is the latter — a URL + an account,
  nothing to run or patch. Accepted as the one external dependency.

## Manual box setup (not code — done at deploy time)
- Create two checks in Healthchecks.io (period 1h / grace, and 2h / grace); put
  their ping URLs in `.env`.
- Pick an ntfy.sh topic, subscribe on phone, put its URL in `.env`.

## Open questions
- ntfy topic names are effectively public — fine for low-stakes civic alerts, but
  consider an unguessable topic or a self-hosted ntfy if that matters.
- Do we also want a daily "still alive, queue depth = N" heartbeat push, or is
  failure-only enough? (Lean failure-only to avoid notification fatigue.)
