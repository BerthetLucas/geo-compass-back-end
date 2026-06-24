# GEO Compass — Back-end

API for **brand ranking** based on AI model answers (GEO — _Generative Engine Optimization_).

The idea: ask questions (prompts) to several AI models, collect the brands they mention, and derive a daily brand ranking — both globally and per model.

> This is the back-end repository. The front-end is at [github.com/BerthetLucas/geo-compass-front-end](https://github.com/BerthetLucas/geo-compass-front-end).

## Table of contents

- [Stack](#stack)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Endpoints](#endpoints)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)

## Stack

| Area | Choice |
| --- | --- |
| Framework | [NestJS 11](https://nestjs.com) |
| ORM | [Drizzle](https://orm.drizzle.team) |
| Database | PostgreSQL ([Neon serverless](https://neon.tech)) |
| LLM calls | [OpenRouter](https://openrouter.ai) (via `@nestjs/axios`) |
| Auth | JWT (`@nestjs/jwt`) + `bcrypt` |
| Language | TypeScript |

## How it works

The full flow, from question to ranking:

1. **Prompts** — The user defines their questions (`prompts`). Only `isActive` prompts are queried.
2. **Querying the models** (`POST /llm`) — For each active prompt × each requested model, we call OpenRouter. A _system prompt_ forces the answer as a JSON array of brands (`["Brand 1", "Brand 2"]`). Raw answers are stored in `llm_responses`.
3. **Ranking computation** (`POST /ranking/compute`) — For a given date, we read that day's responses, extract the brands, count mentions, build the ranking, then store a snapshot in `global_rankings` (all models combined) and `model_rankings` (per model).
4. **Reading** (`GET /geo/*`) — The frontend reads the already-computed snapshots.

> Computation (write) and reading (serve) are intentionally separated: we never recompute on read, we serve a frozen snapshot.

## Architecture

Each domain = one NestJS module, with a single responsibility over its table.

| Module | Role | Repository | Table(s) |
| --- | --- | --- | --- |
| `auth` | Login / register, JWT, `AuthGuard` | — | — |
| `users` | Account management | `UsersRepository` | `users` |
| `prompt` | Questions CRUD | `PromptRepository` | `prompts` |
| `llm` | Model calls + storing raw answers | `LlmRepository` | `llm_responses` |
| `ranking` | **Compute + write** snapshots | `RankingRepository` (write) | `global_rankings`, `model_rankings` |
| `geo` | **Read** snapshots for the frontend | `GeoRepository` (read) | `global_rankings`, `model_rankings` |

**Compute pipeline** (pure functions, in `src/ranking/utils/`):

```
extractBrands  →  countMentions  →  buildRanking
(parse JSON)      (count/brand)      (sort + assign rank)
```

Key rule: no service touches another's table. The write path (`ranking`) and the read path (`geo`) are decoupled — independent modules.

## Data model

```
users ──┬── prompts          (user's questions)
        ├── llm_responses     (raw model answers)
        ├── global_rankings   (daily snapshot, all models)
        └── model_rankings    (daily snapshot, per model)
```

- `global_rankings` / `model_rankings`: `(userId, date, [model], brand, mentions, rank)`. Idempotent rewrite — a `compute` purges then re-inserts the snapshot for the given `(userId, date[, model])`.
- Migrations managed by Drizzle Kit (`drizzle/`).

## Endpoints

All routes except `auth` require an `Authorization: Bearer <token>` header.

### Auth

| Method | Route | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ email, password }` | Creates an account, returns an `access_token` |
| `POST` | `/auth/login` | `{ email, password }` | Returns an `access_token` |

### Prompts

| Method | Route | Body | Description |
| --- | --- | --- | --- |
| `GET` | `/prompt` | — | Lists the user's prompts |
| `POST` | `/prompt` | `{ text }` | Adds a prompt |
| `POST` | `/prompt/delete` | `{ id }` | Deletes a prompt |
| `PUT` | `/prompt/:id` | `{ text?, isActive? }` | Updates a prompt |

### LLM

| Method | Route | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/llm` | `{ models: string[] }` | Queries the models for all active prompts, stores the answers |

### Ranking (compute)

| Method | Route | Query | Description |
| --- | --- | --- | --- |
| `POST` | `/ranking/compute` | `?date=YYYY-MM-DD` | Computes and stores the snapshots (default: today) |

### Geo (read)

| Method | Route | Query | Description |
| --- | --- | --- | --- |
| `GET` | `/geo/global` | `?date=YYYY-MM-DD` | Global ranking for the day |
| `GET` | `/geo/model/:model` | `?date=YYYY-MM-DD` | Ranking for a given model |

## Getting started

```bash
pnpm install

# Drizzle migrations
pnpm drizzle-kit migrate

# dev (watch)
pnpm run start:dev

# prod
pnpm run build && pnpm run start:prod
```

## Environment variables

Create a `.env` file at the root of the project:

```env
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=a_32_byte_hex_key
OPENROUTER_API_KEY=sk-or-...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
PORT=8000
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. Neon) |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `ENCRYPTION_KEY` | Yes | 32-byte hex key for encrypting user API keys |
| `OPENROUTER_API_KEY` | Yes | Default OpenRouter key (used when no user key is set) |
| `DISCORD_WEBHOOK_URL` | No | Discord webhook for daily run notifications |
| `PORT` | No | Listening port, defaults to `8000` |

## Running the full stack locally

1. Start this API on port `8000` (`pnpm start:dev`)
2. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/` in the front-end `.env`
3. Start the front-end — see [geo-compass-front-end](https://github.com/BerthetLucas/geo-compass-front-end)
