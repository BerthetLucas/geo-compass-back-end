import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, type Database } from 'src/db/db.module';
import { globalRankingsTable, modelRankingsTable } from 'src/db/schema';
import { toDateString } from 'src/common/to-date-string';
import { type BrandRanking } from './ranking.types';
import { RankingDbMapper } from './mapper/ranking-db.mapper';

@Injectable()
export class RankingRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async insertGlobalRanking(
    userId: number,
    date: Date,
    brands: BrandRanking[],
  ): Promise<void> {
    await this.db
      .delete(globalRankingsTable)
      .where(
        and(
          eq(globalRankingsTable.date, toDateString(date)),
          eq(globalRankingsTable.userId, userId),
        ),
      );

    if (brands.length === 0) return;

    await this.db
      .insert(globalRankingsTable)
      .values(
        brands.map((b) => RankingDbMapper.toGlobalInsertRow(userId, date, b)),
      );
  }

  async insertModelRanking(
    userId: number,
    date: Date,
    model: string,
    brands: BrandRanking[],
  ): Promise<void> {
    await this.db
      .delete(modelRankingsTable)
      .where(
        and(
          eq(modelRankingsTable.date, toDateString(date)),
          eq(modelRankingsTable.model, model),
          eq(modelRankingsTable.userId, userId),
        ),
      );

    if (brands.length === 0) return;

    await this.db
      .insert(modelRankingsTable)
      .values(
        brands.map((b) =>
          RankingDbMapper.toModelInsertRow(userId, date, model, b),
        ),
      );
  }
}
