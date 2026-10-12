import { Inject, Injectable } from '@nestjs/common';
import { and, asc, between, eq } from 'drizzle-orm';
import { DB, type Database } from 'src/db/db.module';
import { globalRankingsTable, modelRankingsTable } from 'src/db/schema';
import { toDateString } from 'src/common/to-date-string';
import {
  type BrandRanking,
  type DailyRanking,
} from 'src/ranking/ranking.types';
import { GeoDbMapper } from './mapper/geo-db.mapper';

@Injectable()
export class GeoRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findGlobalRanking(date: Date, userId: number): Promise<BrandRanking[]> {
    const rows = await this.db
      .select()
      .from(globalRankingsTable)
      .where(
        and(
          eq(globalRankingsTable.date, toDateString(date)),
          eq(globalRankingsTable.userId, userId),
        ),
      );

    return rows.map((row) => GeoDbMapper.toBrandRanking(row));
  }

  async findAvailableModels(date: Date, userId: number): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ model: modelRankingsTable.model })
      .from(modelRankingsTable)
      .where(
        and(
          eq(modelRankingsTable.date, toDateString(date)),
          eq(modelRankingsTable.userId, userId),
        ),
      );

    return rows.map((row) => row.model);
  }

  async findModelRanking(
    date: Date,
    model: string,
    userId: number,
  ): Promise<BrandRanking[]> {
    const rows = await this.db
      .select()
      .from(modelRankingsTable)
      .where(
        and(
          eq(modelRankingsTable.date, toDateString(date)),
          eq(modelRankingsTable.model, model),
          eq(modelRankingsTable.userId, userId),
        ),
      );

    return rows.map((row) => GeoDbMapper.toBrandRanking(row));
  }

  async findRankingByPeriod(
    startDate: Date,
    endDate: Date,
    userId: number,
  ): Promise<DailyRanking[]> {
    const rows = await this.db
      .select()
      .from(globalRankingsTable)
      .where(
        and(
          eq(globalRankingsTable.userId, userId),
          between(
            globalRankingsTable.date,
            toDateString(startDate),
            toDateString(endDate),
          ),
        ),
      )
      .orderBy(asc(globalRankingsTable.date));

    return GeoDbMapper.toDailyRankings(rows);
  }
}
