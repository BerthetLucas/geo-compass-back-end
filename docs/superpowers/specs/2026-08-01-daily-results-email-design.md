# Daily Results Email — Design (PR 1: direct send, no queue)

## Context

Users can already toggle `emailNotifications` on their account (`User.emailNotifications`, default `true`), but nothing consumes this flag today. The daily cron (`SchedulerService.runDailyDataComputation`, `src/scheduler/scheduler.service.ts`) computes LLM responses and rankings for every user each night, then posts a summary to Discord. This is the natural point to also email each user their daily global ranking.

`bullmq`, `@nestjs/bullmq`, and `ioredis` are already installed but unused, and no `REDIS_URL` is configured yet. This design deliberately **defers the queue** to a follow-up PR (PR 2), to decouple learning Resend from learning BullMQ/Redis. This PR sends emails synchronously, directly from the cron.

## Scope

This is the first of two planned changes:
- **PR 1 (this spec):** send a daily results email directly via Resend, no queue.
- **PR 2 (future, separate spec):** move email sending behind a BullMQ queue backed by Redis (Railway-hosted), for retries/decoupling once volume or reliability needs justify it.

## Goals

- Each user with `emailNotifications === true` receives one email per day, after the cron finishes processing all users, containing their global brand ranking for the day.
- Sending is resilient: a failure for one user's email must not block others, and must not fail the cron.
- Failures are visible in the existing Discord notification.

## Non-goals

- No queue/Redis in this PR (see PR 2).
- No per-model ranking breakdown in the email (global ranking only).
- No automated tests in this PR — verification is manual (see below). The user is implementing this PR themselves with guidance; tests may be added later.
- No unsubscribe link / email preferences UI changes — the existing `emailNotifications` toggle (already exposed via `UsersController`/`UsersService`) is the only control.

## Architecture

### New `EmailModule` (`src/email/`)

- `email.module.ts` — standalone module, imported by `SchedulerModule`.
- `email.service.ts` — `EmailService`, wraps a Resend client (`new Resend(process.env.RESEND_API_KEY)`), exposes:
  ```ts
  sendDailyRankingEmail(user: User, ranking: BrandRanking[], date: Date): Promise<void>
  ```
  Internally calls `resend.emails.send({ from, to: user.email, subject, react: <DailyResultsEmail ranking={ranking} date={date} /> })`. Throws on failure (caller is responsible for catching).
- `templates/daily-results-email.tsx` — a React Email component (`@react-email/components`): header with the date, a table of `rank / brand / mentions`, and a fallback message ("Aucune mention détectée aujourd'hui") when `ranking.length === 0`.

### New dependencies

- Runtime: `resend`, `react`, `react-dom`, `@react-email/components`.
- Dev: `react-email` (CLI for local template preview via `npx react-email dev`, no Resend quota consumed).

### New environment variables

- `RESEND_API_KEY` — Resend API key.
- `EMAIL_FROM` — sender address. Defaults to `onboarding@resend.dev` (Resend's shared test domain) until a custom domain is verified.
  - **Known constraint:** with the test domain, Resend only allows delivery to the email address of the Resend account owner — not to arbitrary user addresses. The step-by-step guide covers DNS domain verification to lift this restriction.

### Data flow / scheduler integration

`RankingService` is **not modified** — reusing the existing read path preserves single-responsibility (compute+store stays separate from read).

There is already a read path for global rankings used by the dashboard: `GeoService.getGlobalRanking(date, userId)` → `GeoRepository.findGlobalRanking(dateStr, userId)`. The scheduler reuses this.

In `SchedulerService.runDailyDataComputation`:

1. The existing per-user loop (LLM queries + `computeAndStoreAllRankings`) is unchanged.
2. **After** that loop completes (not interleaved), a second loop runs: for each user, fetch `geoService.getGlobalRanking(today, user.id)`, and if `user.emailNotifications === true`, call `emailService.sendDailyRankingEmail(user, ranking, today)`.
3. Each email send is wrapped in its own try/catch. Failures are pushed to a new `emailErrors: string[]` array (parallel to the existing `errors` array for computation failures) and logged — they never throw out of the loop.
4. `SchedulerModule` gains `GeoModule` and `EmailModule` as imports.

### Discord notification changes

The existing embed gains two changes:
- `Échecs` is relabeled `Échecs calcul` (clarify it's about the compute step).
- A new field `Échecs email` shows `emailErrors.length`.
- If `emailErrors` is non-empty, its details are appended similarly to the existing `Détails` field (or a separate `Détails email` field if both `errors` and `emailErrors` are non-empty — avoid conflating the two failure sources in one blob).
- The embed color logic (`errors.length ? red : green`) is extended to also turn red if `emailErrors.length > 0`.

## Manual verification (no automated tests in this PR)

- Local template preview: `npx react-email dev`, visually check the rendered email (with and without ranking data).
- End-to-end: trigger the cron manually (or a temporary test endpoint) against a user whose email matches the Resend account owner's address (required by the test-domain constraint above), and confirm actual delivery/rendering in an inbox.
- Confirm a user with `emailNotifications: false` receives no email.
- Confirm a simulated Resend failure (e.g. temporarily invalid API key) shows up in `emailErrors` / the Discord embed without crashing the cron.

## Follow-up (PR 2, separate spec)

Once this is working in production: introduce a BullMQ queue (`@nestjs/bullmq`) backed by a Railway Redis service, move `sendDailyRankingEmail` calls into a queued job with a processor, and add retry/backoff policies. This is where the BullMQ tutorial content belongs.
