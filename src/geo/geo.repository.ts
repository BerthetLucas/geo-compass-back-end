import { Inject, Injectable } from '@nestjs/common';
import { and, asc, between, eq } from 'drizzle-orm';
import { DB, type Database } from 'src/db/db.module';
import { globalRankingsTable, modelRankingsTable } from 'src/db/schema';
import {
  type BrandRanking,
  type DailyRanking,
} from 'src/ranking/ranking.types';

@Injectable()
export class GeoRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

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

  async findRankingByPeriod(
    startDate: string,
    endDate: string,
    userId: number,
  ): Promise<DailyRanking[]> {
    const rows = await this.db
      .select()
      .from(globalRankingsTable)
      .where(
        and(
          eq(globalRankingsTable.userId, userId),
          between(globalRankingsTable.date, startDate, endDate),
        ),
      )
      .orderBy(asc(globalRankingsTable.date));

    const rankingsByDate: Record<string, BrandRanking[]> = {};

    for (const row of rows) {
      if (!rankingsByDate[row.date]) {
        rankingsByDate[row.date] = [];
      }
      rankingsByDate[row.date].push({
        rank: row.rank,
        brand: row.brand,
        mentions: row.mentions,
      });
    }

    return Object.entries(rankingsByDate).map(([date, rankings]) => ({
      date,
      rankings,
    }));
  }
}
