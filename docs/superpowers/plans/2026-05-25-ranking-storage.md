# Ranking Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist daily brand rankings (global + per model) in DB, computable on demand via POST endpoint and queryable via GET endpoints.

**Architecture:** Two new DB tables (`global_rankings`, `model_rankings`). A new `ranking` NestJS module owns computation + storage. It imports `GeoModule` to reuse `GeoRepository` for fetching `llm_responses`. Existing utils (`extractBrands`, `countMentions`, `buildRanking`) are reused as-is.

**Tech Stack:** NestJS, Drizzle ORM, Neon Postgres, Jest

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/db/schema.ts` | Add `globalRankingsTable` and `modelRankingsTable` |
| Modify | `src/geo/geo.repository.ts` | Add `findResponsesByDate(date)` |
| Modify | `src/geo/geo.module.ts` | Export `GeoRepository` |
| Create | `src/ranking/ranking.repository.ts` | DB reads/writes for both ranking tables |
| Create | `src/ranking/ranking.service.ts` | Orchestrate compute + store |
| Create | `src/ranking/ranking.controller.ts` | POST /ranking/compute, GET /ranking/global, GET /ranking/model/:model |
| Create | `src/ranking/ranking.module.ts` | Wire providers, import GeoModule |
| Modify | `src/app.module.ts` | Import RankingModule |
| Create | `src/ranking/ranking.service.spec.ts` | Unit tests for RankingService |
| Create | `src/ranking/ranking.repository.spec.ts` | Unit tests for RankingRepository |

---

## Task 1: Add DB tables to schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add the two tables**

Replace the content of `src/db/schema.ts`:

```ts
import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const llmResponseTable = pgTable('llm_responses', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  model: varchar({ length: 255 }).notNull(),
  response: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const globalRankingsTable = pgTable('global_rankings', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  date: date().notNull(),
  brand: varchar({ length: 255 }).notNull(),
  mentions: integer().notNull(),
  rank: integer().notNull(),
});

export const modelRankingsTable = pgTable('model_rankings', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  date: date().notNull(),
  model: varchar({ length: 255 }).notNull(),
  brand: varchar({ length: 255 }).notNull(),
  mentions: integer().notNull(),
  rank: integer().notNull(),
});
```

- [ ] **Step 2: Generate migration**

```bash
pnpm drizzle-kit generate
```

Expected: new file in `drizzle/` with CREATE TABLE for both tables.

- [ ] **Step 3: Apply migration to DB**

```bash
node -e "
const { neon } = require('./node_modules/@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config();
// Read the latest migration file and execute it
const files = fs.readdirSync('./drizzle').filter(f => f.endsWith('.sql')).sort();
const latest = fs.readFileSync('./drizzle/' + files[files.length - 1], 'utf8');
const sql = neon(process.env.DATABASE_URL);
sql(latest).then(() => { console.log('OK'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
"
```

Expected: `OK`

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no output (zero errors)

---

## Task 2: Add `findResponsesByDate` to GeoRepository + export it

**Files:**
- Modify: `src/geo/geo.repository.ts`
- Modify: `src/geo/geo.module.ts`

- [ ] **Step 1: Write failing test**

Create `src/geo/geo.repository.spec.ts`:

```ts
import { GeoRepository } from './geo.repository';

describe('GeoRepository', () => {
  describe('findResponsesByDate', () => {
    it('queries llm_responses with correct date range', async () => {
      const mockRows = [
        { model: 'openai', response: '["Nike"]', createdAt: new Date() },
      ];
      const mockWhere = jest.fn().mockResolvedValue(mockRows);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
      const mockDb = { select: mockSelect } as any;

      const repo = new GeoRepository(mockDb);
      const date = new Date('2026-05-25');
      const result = await repo.findResponsesByDate(date);

      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual(mockRows);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/geo/geo.repository.spec.ts --no-coverage
```

Expected: FAIL — `findResponsesByDate is not a function`

- [ ] **Step 3: Add `findResponsesByDate` to GeoRepository**

Add this method to `src/geo/geo.repository.ts` (after `findTodayResponsesByModel`, before `getStartOfToday`):

```ts
async findResponsesByDate(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return this.db
    .select()
    .from(llmResponseTable)
    .where(
      and(
        gte(llmResponseTable.createdAt, startOfDay),
        lte(llmResponseTable.createdAt, endOfDay),
      ),
    );
}
```

Also add `lte` to the drizzle-orm import at the top:

```ts
import { and, eq, gte, lte } from 'drizzle-orm';
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test src/geo/geo.repository.spec.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Export GeoRepository from GeoModule**

Replace `src/geo/geo.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { GeoRepository } from './geo.repository';

@Module({
  providers: [GeoService, GeoRepository],
  controllers: [GeoController],
  exports: [GeoRepository],
})
export class GeoModule {}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no output

---

## Task 3: Create RankingRepository

**Files:**
- Create: `src/ranking/ranking.repository.ts`
- Create: `src/ranking/ranking.repository.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/ranking/ranking.repository.spec.ts`:

```ts
import { RankingRepository } from './ranking.repository';
import { BrandRanking } from 'src/geo/geo.types';

describe('RankingRepository', () => {
  const mockBrands: BrandRanking[] = [
    { rank: 1, brand: 'Nike', mentions: 10 },
    { rank: 2, brand: 'Adidas', mentions: 5 },
  ];
  const testDate = '2026-05-25';

  function makeMockDb(insertResult = []) {
    const mockReturning = jest.fn().mockResolvedValue(insertResult);
    const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockInsert = jest.fn().mockReturnValue({ values: mockValues });
    const mockWhere = jest.fn().mockResolvedValue([]);
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
    const mockDelete = jest.fn().mockReturnValue({ where: mockWhere });
    return { select: mockSelect, insert: mockInsert, delete: mockDelete } as any;
  }

  describe('insertGlobalRanking', () => {
    it('calls delete then insert with mapped rows', async () => {
      const mockDb = makeMockDb();
      const repo = new RankingRepository(mockDb);
      await repo.insertGlobalRanking(testDate, mockBrands);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('insertModelRanking', () => {
    it('calls delete then insert with model + mapped rows', async () => {
      const mockDb = makeMockDb();
      const repo = new RankingRepository(mockDb);
      await repo.insertModelRanking(testDate, 'openai', mockBrands);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('findGlobalRanking', () => {
    it('queries global_rankings by date', async () => {
      const mockDb = makeMockDb();
      const repo = new RankingRepository(mockDb);
      await repo.findGlobalRanking(testDate);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('findModelRanking', () => {
    it('queries model_rankings by date and model', async () => {
      const mockDb = makeMockDb();
      const repo = new RankingRepository(mockDb);
      await repo.findModelRanking(testDate, 'openai');
      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/ranking/ranking.repository.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './ranking.repository'`

- [ ] **Step 3: Create RankingRepository**

Create `src/ranking/ranking.repository.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, type Database } from 'src/db/db.module';
import { globalRankingsTable, modelRankingsTable } from 'src/db/schema';
import { type BrandRanking } from 'src/geo/geo.types';

@Injectable()
export class RankingRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async insertGlobalRanking(date: string, brands: BrandRanking[]): Promise<void> {
    await this.db
      .delete(globalRankingsTable)
      .where(eq(globalRankingsTable.date, date));

    if (brands.length === 0) return;

    await this.db.insert(globalRankingsTable).values(
      brands.map((b) => ({
        date,
        brand: b.brand,
        mentions: b.mentions,
        rank: b.rank,
      })),
    );
  }

  async insertModelRanking(date: string, model: string, brands: BrandRanking[]): Promise<void> {
    await this.db
      .delete(modelRankingsTable)
      .where(
        and(
          eq(modelRankingsTable.date, date),
          eq(modelRankingsTable.model, model),
        ),
      );

    if (brands.length === 0) return;

    await this.db.insert(modelRankingsTable).values(
      brands.map((b) => ({
        date,
        model,
        brand: b.brand,
        mentions: b.mentions,
        rank: b.rank,
      })),
    );
  }

  async findGlobalRanking(date: string): Promise<BrandRanking[]> {
    const rows = await this.db
      .select()
      .from(globalRankingsTable)
      .where(eq(globalRankingsTable.date, date));

    return rows.map((r) => ({
      rank: r.rank,
      brand: r.brand,
      mentions: r.mentions,
    }));
  }

  async findModelRanking(date: string, model: string): Promise<BrandRanking[]> {
    const rows = await this.db
      .select()
      .from(modelRankingsTable)
      .where(
        and(
          eq(modelRankingsTable.date, date),
          eq(modelRankingsTable.model, model),
        ),
      );

    return rows.map((r) => ({
      rank: r.rank,
      brand: r.brand,
      mentions: r.mentions,
    }));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test src/ranking/ranking.repository.spec.ts --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no output

---

## Task 4: Create RankingService

**Files:**
- Create: `src/ranking/ranking.service.ts`
- Create: `src/ranking/ranking.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/ranking/ranking.service.spec.ts`:

```ts
import { RankingService } from './ranking.service';

describe('RankingService', () => {
  const testDate = new Date('2026-05-25T12:00:00Z');
  const testDateStr = '2026-05-25';

  const mockResponses = [
    { model: 'openai', response: '["Nike","Adidas"]', createdAt: testDate },
    { model: 'anthropic', response: '["Nike","Puma"]', createdAt: testDate },
    { model: 'openai', response: '["Nike"]', createdAt: testDate },
  ];

  function makeRepo(overrides = {}) {
    return {
      findResponsesByDate: jest.fn().mockResolvedValue(mockResponses),
      ...overrides,
    } as any;
  }

  function makeRankingRepo(overrides = {}) {
    return {
      insertGlobalRanking: jest.fn().mockResolvedValue(undefined),
      insertModelRanking: jest.fn().mockResolvedValue(undefined),
      findGlobalRanking: jest.fn().mockResolvedValue([]),
      findModelRanking: jest.fn().mockResolvedValue([]),
      ...overrides,
    } as any;
  }

  describe('computeAndStoreGlobalRanking', () => {
    it('fetches responses, computes ranking, stores it', async () => {
      const geoRepo = makeRepo();
      const rankingRepo = makeRankingRepo();
      const service = new RankingService(geoRepo, rankingRepo);

      await service.computeAndStoreGlobalRanking(testDate);

      expect(geoRepo.findResponsesByDate).toHaveBeenCalledWith(testDate);
      expect(rankingRepo.insertGlobalRanking).toHaveBeenCalledWith(
        testDateStr,
        expect.arrayContaining([
          expect.objectContaining({ brand: 'Nike', mentions: 3, rank: 1 }),
        ]),
      );
    });
  });

  describe('computeAndStoreModelRankings', () => {
    it('groups by model and stores one ranking per model', async () => {
      const geoRepo = makeRepo();
      const rankingRepo = makeRankingRepo();
      const service = new RankingService(geoRepo, rankingRepo);

      await service.computeAndStoreModelRankings(testDate);

      expect(rankingRepo.insertModelRanking).toHaveBeenCalledWith(
        testDateStr,
        'openai',
        expect.any(Array),
      );
      expect(rankingRepo.insertModelRanking).toHaveBeenCalledWith(
        testDateStr,
        'anthropic',
        expect.any(Array),
      );
    });
  });

  describe('computeAndStoreAllRankings', () => {
    it('calls both global and model ranking computation', async () => {
      const geoRepo = makeRepo();
      const rankingRepo = makeRankingRepo();
      const service = new RankingService(geoRepo, rankingRepo);

      const spyGlobal = jest.spyOn(service, 'computeAndStoreGlobalRanking');
      const spyModel = jest.spyOn(service, 'computeAndStoreModelRankings');

      await service.computeAndStoreAllRankings(testDate);

      expect(spyGlobal).toHaveBeenCalledWith(testDate);
      expect(spyModel).toHaveBeenCalledWith(testDate);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/ranking/ranking.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './ranking.service'`

- [ ] **Step 3: Create RankingService**

Create `src/ranking/ranking.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { GeoRepository } from 'src/geo/geo.repository';
import { extractBrands } from 'src/geo/utils/extract-brands';
import { countMentions } from 'src/geo/utils/count-mentions';
import { buildRanking } from 'src/geo/utils/build-ranking';
import { RankingRepository } from './ranking.repository';

@Injectable()
export class RankingService {
  constructor(
    private readonly geoRepository: GeoRepository,
    private readonly rankingRepository: RankingRepository,
  ) {}

  async computeAndStoreAllRankings(date: Date): Promise<void> {
    await this.computeAndStoreGlobalRanking(date);
    await this.computeAndStoreModelRankings(date);
  }

  async computeAndStoreGlobalRanking(date: Date): Promise<void> {
    const responses = await this.geoRepository.findResponsesByDate(date);
    const brands = extractBrands(responses);
    const counts = countMentions(brands);
    const ranking = buildRanking(counts);
    const dateStr = this.toDateString(date);
    await this.rankingRepository.insertGlobalRanking(dateStr, ranking);
  }

  async computeAndStoreModelRankings(date: Date): Promise<void> {
    const responses = await this.geoRepository.findResponsesByDate(date);
    const dateStr = this.toDateString(date);

    const modelNames = [...new Set(responses.map((r) => r.model))];

    for (const model of modelNames) {
      const modelResponses = responses.filter((r) => r.model === model);
      const brands = extractBrands(modelResponses);
      const counts = countMentions(brands);
      const ranking = buildRanking(counts);
      await this.rankingRepository.insertModelRanking(dateStr, model, ranking);
    }
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test src/ranking/ranking.service.spec.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no output

---

## Task 5: Create RankingController + Module + Register in App

**Files:**
- Create: `src/ranking/ranking.controller.ts`
- Create: `src/ranking/ranking.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Create RankingController**

Create `src/ranking/ranking.controller.ts`:

```ts
import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingRepository } from './ranking.repository';
import { type BrandRanking } from 'src/geo/geo.types';

@Controller('ranking')
export class RankingController {
  constructor(
    private readonly rankingService: RankingService,
    private readonly rankingRepository: RankingRepository,
  ) {}

  @Post('compute')
  async computeRanking(
    @Query('date') dateParam?: string,
  ): Promise<{ success: boolean; date: string }> {
    const date = dateParam ? new Date(dateParam) : new Date();
    await this.rankingService.computeAndStoreAllRankings(date);
    return { success: true, date: date.toISOString().split('T')[0] };
  }

  @Get('global')
  async getGlobalRanking(
    @Query('date') dateParam?: string,
  ): Promise<BrandRanking[]> {
    const date = dateParam ?? new Date().toISOString().split('T')[0];
    return this.rankingRepository.findGlobalRanking(date);
  }

  @Get('model/:model')
  async getModelRanking(
    @Param('model') model: string,
    @Query('date') dateParam?: string,
  ): Promise<BrandRanking[]> {
    const date = dateParam ?? new Date().toISOString().split('T')[0];
    return this.rankingRepository.findModelRanking(date, model);
  }
}
```

- [ ] **Step 2: Create RankingModule**

Create `src/ranking/ranking.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { GeoModule } from 'src/geo/geo.module';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { RankingRepository } from './ranking.repository';

@Module({
  imports: [GeoModule],
  controllers: [RankingController],
  providers: [RankingService, RankingRepository],
})
export class RankingModule {}
```

- [ ] **Step 3: Register RankingModule in AppModule**

Replace `src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmModule } from './llm/llm.module';
import { GeoModule } from './geo/geo.module';
import { RankingModule } from './ranking/ranking.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    LlmModule,
    GeoModule,
    RankingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no output

- [ ] **Step 5: Run all tests**

```bash
pnpm test --no-coverage
```

Expected: all tests pass

- [ ] **Step 6: Manual smoke test**

Start the server:
```bash
pnpm start:dev
```

Trigger compute for today:
```bash
curl -X POST "http://localhost:3000/ranking/compute"
```
Expected: `{"success":true,"date":"2026-05-25"}`

Fetch global ranking:
```bash
curl "http://localhost:3000/ranking/global"
```
Expected: JSON array of `{ rank, brand, mentions }`

Fetch model ranking:
```bash
curl "http://localhost:3000/ranking/model/openai"
```
Expected: JSON array for openai model
