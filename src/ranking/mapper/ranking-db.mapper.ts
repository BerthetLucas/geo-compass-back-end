import { toDateString } from 'src/common/to-date-string';
import {
  type NewGlobalRankingRow,
  type NewModelRankingRow,
} from 'src/db/schemas/rankings.schema';
import { type BrandRanking } from '../ranking.types';

export class RankingDbMapper {
  static toGlobalInsertRow(
    userId: number,
    date: Date,
    ranking: BrandRanking,
  ): NewGlobalRankingRow {
    return {
      userId,
      date: toDateString(date),
      brand: ranking.brand,
      mentions: ranking.mentions,
      rank: ranking.rank,
    };
  }

  static toModelInsertRow(
    userId: number,
    date: Date,
    model: string,
    ranking: BrandRanking,
  ): NewModelRankingRow {
    return {
      userId,
      date: toDateString(date),
      model,
      brand: ranking.brand,
      mentions: ranking.mentions,
      rank: ranking.rank,
    };
  }
}
