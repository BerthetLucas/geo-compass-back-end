import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, type Database } from 'src/db/db.module';
import { globalRankingsTable, modelRankingsTable } from 'src/db/schema';
import { type BrandRanking } from 'src/geo/geo.types';

@Injectable()
export class RankingRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async insertGlobalRanking(
    userId: number,
    date: string,
    brands: BrandRanking[],
  ): Promise<void> {
    await this.db
      .delete(globalRankingsTable)
      .where(eq(globalRankingsTable.date, date));

    if (brands.length === 0) return;

    await this.db.insert(globalRankingsTable).values(
      brands.map((b) => ({
        userId,
        date,
        brand: b.brand,
        mentions: b.mentions,
        rank: b.rank,
      })),
    );
  }

  async insertModelRanking(
    userId: number,
    date: string,
    model: string,
    brands: BrandRanking[],
  ): Promise<void> {
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
        userId,
        date,
        model,
        brand: b.brand,
        mentions: b.mentions,
        rank: b.rank,
      })),
    );
  }

  async findGlobalRanking(
    date: string,
    userId: number,
  ): Promise<BrandRanking[]> {
    const rows = await this.db
      .select()
      .from(globalRankingsTable)
      .where(
        and(
          eq(globalRankingsTable.date, date),
          eq(globalRankingsTable.userId, userId),
        ),
      );

    return rows.map((r) => ({
      rank: r.rank,
      brand: r.brand,
      mentions: r.mentions,
    }));
  }

  async findModelRanking(
    date: string,
    model: string,
    userId: number,
  ): Promise<BrandRanking[]> {
    const rows = await this.db
      .select()
      .from(modelRankingsTable)
      .where(
        and(
          eq(modelRankingsTable.date, date),
          eq(modelRankingsTable.model, model),
          eq(modelRankingsTable.userId, userId),
        ),
      );

    return rows.map((r) => ({
      rank: r.rank,
      brand: r.brand,
      mentions: r.mentions,
    }));
  }
}
