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
