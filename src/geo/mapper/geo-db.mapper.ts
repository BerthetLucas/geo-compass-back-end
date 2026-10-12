import {
  type GlobalRankingRow,
  type ModelRankingRow,
} from 'src/db/schemas/rankings.schema';
import {
  type BrandRanking,
  type DailyRanking,
} from 'src/ranking/ranking.types';

export class GeoDbMapper {
  static toBrandRanking(row: GlobalRankingRow | ModelRankingRow): BrandRanking {
    return { rank: row.rank, brand: row.brand, mentions: row.mentions };
  }

  // Rows must already be sorted by date.
  static toDailyRankings(rows: GlobalRankingRow[]): DailyRanking[] {
    const rankingsByDate: Record<string, BrandRanking[]> = {};

    for (const row of rows) {
      (rankingsByDate[row.date] ??= []).push(GeoDbMapper.toBrandRanking(row));
    }

    return Object.entries(rankingsByDate).map(([date, rankings]) => ({
      date,
      rankings,
    }));
  }
}
