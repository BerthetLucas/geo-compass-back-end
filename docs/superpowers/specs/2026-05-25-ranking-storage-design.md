# Ranking Storage Design

## Context

LLM responses are stored in `llm_responses`. Rankings are currently computed on the fly. We want to persist daily rankings for historical tracking and performance — global (all models combined) and per model.

## Schema

Two new tables in `src/db/schema.ts`:

```ts
global_rankings
  id        integer PK autoincrement
  date      date NOT NULL
  brand     varchar(255) NOT NULL
  mentions  integer NOT NULL
  rank      integer NOT NULL

model_rankings
  id        integer PK autoincrement
  date      date NOT NULL
  model     varchar(255) NOT NULL
  brand     varchar(255) NOT NULL
  mentions  integer NOT NULL
  rank      integer NOT NULL
```

Index on `date` in both tables.

## Architecture

New `ranking` module, independent of `geo`:

```
src/ranking/
├── ranking.module.ts
├── ranking.controller.ts
├── ranking.service.ts
└── ranking.repository.ts
```

`RankingModule` imports `GeoModule` to access `GeoRepository` (fetch llm_responses by date).

Existing utils (`extractBrands`, `countMentions`, `buildRanking`) are reused as-is.

## RankingService

```
computeAndStoreAllRankings(date: Date)
  → computeAndStoreGlobalRanking(date)
  → computeAndStoreModelRankings(date)

computeAndStoreGlobalRanking(date)
  1. GeoRepository.findResponsesByDate(date)
  2. extractBrands → countMentions → buildRanking
  3. RankingRepository.insertGlobalRanking(date, ranking)

computeAndStoreModelRankings(date)
  1. GeoRepository.findResponsesByDate(date)
  2. Group rows by model → distinct model list
  3. For each model:
       extractBrands → countMentions → buildRanking
       RankingRepository.insertModelRanking(date, model, ranking)
```

## RankingRepository

```
insertGlobalRanking(date, brands: BrandRanking[])
  → DELETE existing rows for this date
  → bulk INSERT into global_rankings

insertModelRanking(date, model, brands: BrandRanking[])
  → DELETE existing rows for this date + model
  → bulk INSERT into model_rankings

findGlobalRanking(date) → BrandRanking[]
findModelRanking(date, model) → BrandRanking[]
```

Delete-before-insert = idempotent. Re-running compute for the same date is safe.

## Endpoints

```
POST /ranking/compute?date=2026-05-25
  Body: none
  Response: { success: true, date: string }

GET /ranking/global?date=2026-05-25
  Response: BrandRanking[]

GET /ranking/model/:model?date=2026-05-25
  Response: BrandRanking[]
```

`date` query param is optional — defaults to today.

## Out of Scope (this spec)

- Cron job (planned separately)
- Ranking read endpoints in GeoController (replaced by RankingController)

## Types

Reuse `BrandRanking` from `src/geo/geo.types.ts`.

```ts
interface BrandRanking {
  rank: number;
  brand: string;
  mentions: number;
}
```
