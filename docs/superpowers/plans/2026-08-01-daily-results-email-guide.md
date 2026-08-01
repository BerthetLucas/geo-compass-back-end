# Daily Results Email — Guided Implementation (PR 1)

> **This is a self-implementation guide, not an autonomous execution plan.** You (Lucas) write the code; I explain each step, show reference snippets, and review as you go. Don't dispatch a subagent or `executing-plans` against this file — work through it interactively in this conversation, one task at a time, and check in after each one.

**Goal:** Send each user a daily email with their global brand ranking, right after the nightly cron finishes, using Resend + React Email — no queue yet.

**Spec:** `docs/superpowers/specs/2026-08-01-daily-results-email-design.md`

**Tech Stack:** Resend (`resend` npm package), React Email (`@react-email/components`), NestJS module wiring.

## Global Constraints (from spec)

- No BullMQ/Redis in this PR — direct synchronous send from the cron (deferred to PR 2).
- Global ranking only in the email body — no per-model breakdown.
- No automated tests in this PR — manual verification only.
- Email sent only to users with `emailNotifications === true`.
- Emails sent **after** the full per-user compute loop finishes, not interleaved.
- Resend's test domain (`onboarding@resend.dev`) only delivers to the account owner's own address until a custom domain is verified — expect this limitation during manual testing.

---

### Task 1: Resend account setup + env vars

**Files:**
- Modify: `.env` (add `RESEND_API_KEY`, `EMAIL_FROM`)

**What you're doing:** getting a working Resend API key so later tasks have something to call.

- [ ] **Step 1:** In the Resend dashboard, go to *API Keys* → create a new key (e.g. named `geo-compass-dev`). Copy it.
- [ ] **Step 2:** Add to `.env`:
  ```
  RESEND_API_KEY=re_xxx...
  EMAIL_FROM=onboarding@resend.dev
  ```
- [ ] **Step 3:** In the Resend dashboard, note the email address tied to your Resend account login — that's the *only* address that will actually receive mail while you're on the test domain. You'll use it in Task 6's manual test.

No commit for this task (`.env` isn't tracked). Let me know once your key is in place and I'll move you to Task 2.

---

### Task 2: Install dependencies

**Files:** `package.json` (via package manager)

- [ ] **Step 1:** Install runtime deps:
  ```bash
  pnpm add resend react react-dom @react-email/components
  ```
- [ ] **Step 2:** Install the dev-only preview CLI:
  ```bash
  pnpm add -D react-email
  ```
- [ ] **Step 3:** Add a `email:dev` script to `package.json` so you can preview templates without touching Resend's quota:
  ```json
  "email:dev": "email dev --dir src/email/templates"
  ```
- [ ] **Step 4:** Commit:
  ```bash
  git add package.json pnpm-lock.yaml
  git commit -m "chore: add resend and react-email dependencies"
  ```

Ping me once installed — I'll walk you through what each package actually does before you write code with it.

---

### Task 3: `EmailModule` scaffold + `DailyResultsEmail` template

**Files:**
- Create: `src/email/email.module.ts`
- Create: `src/email/email.service.ts`
- Create: `src/email/templates/daily-results-email.tsx`

**Interfaces:**
- Produces: `EmailService.sendDailyRankingEmail(user: User, ranking: BrandRanking[], date: Date): Promise<void>` — this is what `SchedulerService` calls in Task 5.
- Consumes: `User` from `src/users/users.types.ts`, `BrandRanking` from `src/ranking/ranking.types.ts`.

**What you're doing:** building the piece that turns a ranking into an email and sends it. I'll give you the shape of each file; write it yourself and ask me if any part (JSX syntax, Resend's API, whatever) doesn't make sense — that's the point of doing this manually.

- [ ] **Step 1: Write the template component.** Reference shape for `daily-results-email.tsx` (a React Email component is just JSX using `@react-email/components` building blocks instead of raw HTML tags):
  ```tsx
  import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Row,
    Column,
    Section,
    Text,
  } from '@react-email/components';
  import type { BrandRanking } from '../../ranking/ranking.types';

  interface DailyResultsEmailProps {
    ranking: BrandRanking[];
    date: Date;
  }

  export function DailyResultsEmail({ ranking, date }: DailyResultsEmailProps) {
    const dateLabel = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <Html>
        <Head />
        <Preview>Votre classement du {dateLabel}</Preview>
        <Body style={{ fontFamily: 'sans-serif' }}>
          <Container>
            <Heading>Résultats du {dateLabel}</Heading>
            {ranking.length === 0 ? (
              <Text>Aucune mention détectée aujourd'hui.</Text>
            ) : (
              <Section>
                {ranking.map((entry) => (
                  <Row key={entry.brand}>
                    <Column>#{entry.rank}</Column>
                    <Column>{entry.brand}</Column>
                    <Column>{entry.mentions} mentions</Column>
                  </Row>
                ))}
              </Section>
            )}
          </Container>
        </Body>
      </Html>
    );
  }

  export default DailyResultsEmail;
  ```
  A default export is required for the `react-email dev` preview server to pick the file up.

- [ ] **Step 2: Preview it.** Run:
  ```bash
  pnpm email:dev
  ```
  Open the printed local URL, confirm the template renders with sample data. (You'll need to temporarily hardcode sample `ranking`/`date` props somewhere, or check the `react-email` docs for its preview-props pattern — ask me if you get stuck here.)

- [ ] **Step 3: Write `EmailService`.** Reference shape:
  ```ts
  import { Injectable, Logger } from '@nestjs/common';
  import { Resend } from 'resend';
  import type { User } from '../users/users.types';
  import type { BrandRanking } from '../ranking/ranking.types';
  import { DailyResultsEmail } from './templates/daily-results-email';

  @Injectable()
  export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly resend = new Resend(process.env.RESEND_API_KEY);

    async sendDailyRankingEmail(
      user: User,
      ranking: BrandRanking[],
      date: Date,
    ): Promise<void> {
      const { error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
        to: user.email,
        subject: `Votre classement du ${date.toLocaleDateString('fr-FR')}`,
        react: DailyResultsEmail({ ranking, date }),
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }
    }
  }
  ```
  Note: `sendDailyRankingEmail` **throws** on failure rather than swallowing it — the caller (Task 5, in the scheduler) is responsible for catching per-user and recording the failure. Don't add a try/catch inside this service.

- [ ] **Step 4: Write `email.module.ts`:**
  ```ts
  import { Module } from '@nestjs/common';
  import { EmailService } from './email.service';

  @Module({
    providers: [EmailService],
    exports: [EmailService],
  })
  export class EmailModule {}
  ```

- [ ] **Step 5: Commit:**
  ```bash
  git add src/email
  git commit -m "feat: add EmailService and daily results email template"
  ```

This is the biggest task in the guide — take your time, and tell me where the React Email JSX or the Resend response shape trips you up.

---

### Task 4: Export `GeoService` from `GeoModule`

**Files:**
- Modify: `src/geo/geo.module.ts`

**What you're doing:** `GeoModule` currently only registers `GeoService` as a provider — it doesn't export it, so no other module can inject it yet. `SchedulerModule` will need it in Task 5.

- [ ] **Step 1:** Open `src/geo/geo.module.ts` and add an `exports` array:
  ```ts
  @Module({
    imports: [AuthModule],
    providers: [GeoService, GeoRepository, AuthGuard],
    controllers: [GeoController],
    exports: [GeoService],
  })
  export class GeoModule {}
  ```
- [ ] **Step 2:** Commit:
  ```bash
  git add src/geo/geo.module.ts
  git commit -m "feat: export GeoService for use outside GeoModule"
  ```

---

### Task 5: Wire emails into the cron

**Files:**
- Modify: `src/scheduler/scheduler.module.ts`
- Modify: `src/scheduler/scheduler.service.ts`

**Interfaces:**
- Consumes: `EmailService.sendDailyRankingEmail(user, ranking, date)` (Task 3), `GeoService.getGlobalRanking(date, userId): Promise<BrandRanking[]>` (already exists, now exported per Task 4).

**What you're doing:** after the existing per-user compute loop, add a second loop that emails each opted-in user their ranking, then extend the Discord embed with email failure counts.

- [ ] **Step 1:** Update `scheduler.module.ts` imports:
  ```ts
  import { Module } from '@nestjs/common';
  import { SchedulerService } from './scheduler.service';
  import { UsersModule } from 'src/users/users.module';
  import { RankingModule } from 'src/ranking/ranking.module';
  import { LlmModule } from 'src/llm/llm.module';
  import { GeoModule } from 'src/geo/geo.module';
  import { EmailModule } from 'src/email/email.module';

  @Module({
    imports: [UsersModule, RankingModule, LlmModule, GeoModule, EmailModule],
    providers: [SchedulerService],
  })
  export class SchedulerModule {}
  ```

- [ ] **Step 2:** In `scheduler.service.ts`, inject the two new services and add the second loop. Here's the full updated method for reference — read through it, then adapt/type it yourself rather than pasting blindly, since this is the core logic of the feature:
  ```ts
  import { Injectable, Logger } from '@nestjs/common';
  import { Cron } from '@nestjs/schedule';
  import axios from 'axios';
  import { AVAILABLE_MODELS } from 'src/llm/constants/models';
  import { LlmService } from 'src/llm/llm.service';
  import { RankingService } from 'src/ranking/ranking.service';
  import { UsersService } from 'src/users/users.service';
  import { GeoService } from 'src/geo/geo.service';
  import { EmailService } from 'src/email/email.service';

  @Injectable()
  export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
      private readonly usersService: UsersService,
      private readonly llmService: LlmService,
      private readonly rankingService: RankingService,
      private readonly geoService: GeoService,
      private readonly emailService: EmailService,
    ) {}

    @Cron('0 2 * * *', { timeZone: 'Europe/Paris' })
    async runDailyDataComputation() {
      this.logger.log('Cron started');
      const start = Date.now();
      const users = await this.usersService.findAll();
      const today = new Date();
      const errors: string[] = [];
      const emailErrors: string[] = [];

      for (const user of users) {
        try {
          await this.llmService.sendLlmQueries(user.id, AVAILABLE_MODELS);
          await this.rankingService.computeAndStoreAllRankings(user.id, today);
        } catch (error) {
          this.logger.error(`Cron failed for user ${user.id}`, error);
          errors.push(
            `${user.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      for (const user of users) {
        if (!user.emailNotifications) continue;
        try {
          const ranking = await this.geoService.getGlobalRanking(today, user.id);
          await this.emailService.sendDailyRankingEmail(user, ranking, today);
        } catch (error) {
          this.logger.error(`Email failed for user ${user.id}`, error);
          emailErrors.push(
            `${user.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const duration = ((Date.now() - start) / 1000).toFixed(1);
      await this.notifyDiscord({
        color: errors.length || emailErrors.length ? 0xed4245 : 0x57f287,
        title:
          errors.length || emailErrors.length
            ? '⚠️ Cron daily — erreurs partielles'
            : '✅ Cron daily — succès',
        fields: [
          { name: 'Utilisateurs', value: String(users.length), inline: true },
          { name: 'Échecs calcul', value: String(errors.length), inline: true },
          { name: 'Échecs email', value: String(emailErrors.length), inline: true },
          { name: 'Durée', value: `${duration}s`, inline: true },
          { name: 'Date', value: today.toISOString(), inline: false },
          ...(errors.length
            ? [
                {
                  name: 'Détails calcul',
                  value: errors.join('\n').slice(0, 1000),
                  inline: false,
                },
              ]
            : []),
          ...(emailErrors.length
            ? [
                {
                  name: 'Détails email',
                  value: emailErrors.join('\n').slice(0, 1000),
                  inline: false,
                },
              ]
            : []),
        ],
      });
    }

    private async notifyDiscord(embed: {
      color: number;
      title: string;
      fields: { name: string; value: string; inline: boolean }[];
    }) {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) return;

      try {
        await axios.post(webhookUrl, { embeds: [embed] });
      } catch (error) {
        this.logger.error('Discord webhook failed', error);
      }
    }
  }
  ```

- [ ] **Step 3:** Run the app locally (`pnpm start:dev`) and confirm it boots without DI errors (a missing `exports: [GeoService]` from Task 4 would surface here as a "cannot resolve dependency" error).

- [ ] **Step 4:** Commit:
  ```bash
  git add src/scheduler
  git commit -m "feat: send daily ranking email to opted-in users after cron"
  ```

---

### Task 6: Manual end-to-end verification

**What you're doing:** confirming the whole path works against the real Resend API, within the test-domain constraint.

- [ ] **Step 1:** Temporarily set your own account's email (matching your Resend login) as a test user's `email` in the DB, and ensure `emailNotifications = true` for that user.
- [ ] **Step 2:** Trigger the cron manually. Easiest option: temporarily change the `@Cron('0 2 * * *', ...)` expression to something a minute in the future, run `pnpm start:dev`, and revert after. (Don't add a permanent test endpoint for this — it's not part of the spec's scope.)
- [ ] **Step 3:** Confirm the email arrives, renders correctly, and shows the right ranking/date.
- [ ] **Step 4:** Set `emailNotifications = false` for that user, re-trigger, confirm no email is sent.
- [ ] **Step 5:** Temporarily set `RESEND_API_KEY` to an invalid value, re-trigger, confirm: the cron still completes, the Discord embed shows a non-zero `Échecs email` count with the error detail, and the app doesn't crash. Restore the real key afterward.

---

### Follow-up (not part of this guide)

- Custom domain verification in Resend (DNS records) — needed before emails can reach arbitrary user addresses, not just your own account email. Ask me when you're ready to set this up; it's independent of the code above.
- PR 2: BullMQ + Redis (Railway) queue for email sending — separate spec/guide once this PR is merged and working.
