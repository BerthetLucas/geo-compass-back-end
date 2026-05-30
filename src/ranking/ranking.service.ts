import { Injectable } from '@nestjs/common';
import { GeoRepository } from 'src/geo/geo.repository';
import { extractBrands } from 'src/geo/utils/extract-brands';
import { countMentions } from 'src/geo/utils/count-mentions';
import { buildRanking } from 'src/geo/utils/build-ranking';
import { RankingRepository } from './ranking.repository';
import { BrandRanking } from 'src/geo/geo.types';

@Injectable()
export class RankingService {
  constructor(
    private readonly geoRepository: GeoRepository,
    private readonly rankingRepository: RankingRepository,
  ) {}

  async computeAndStoreAllRankings(userId: number, date: Date): Promise<void> {
    await this.computeAndStoreGlobalRanking(userId, date);
    await this.computeAndStoreModelRankings(userId, date);
  }

  async computeAndStoreGlobalRanking(
    userId: number,
    date: Date,
  ): Promise<void> {
    const responses = await this.geoRepository.findResponsesByDate(date);
    const brands = extractBrands(responses);
    const counts = countMentions(brands);
    const ranking = buildRanking(counts);
    const dateStr = this.toDateString(date);
    await this.rankingRepository.insertGlobalRanking(userId, dateStr, ranking);
  }

  async computeAndStoreModelRankings(
    userId: number,
    date: Date,
  ): Promise<void> {
    const responses = await this.geoRepository.findResponsesByDate(date);
    const dateStr = this.toDateString(date);

    const modelNames = [...new Set(responses.map((r) => r.model))];

    for (const model of modelNames) {
      const modelResponses = responses.filter((r) => r.model === model);
      const brands = extractBrands(modelResponses);
      const counts = countMentions(brands);
      const ranking = buildRanking(counts);
      await this.rankingRepository.insertModelRanking(
        userId,
        dateStr,
        model,
        ranking,
      );
    }
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async getGlobalRanking(date: Date, userId: number): Promise<BrandRanking[]> {
    const dateStr = this.toDateString(date);
    return this.rankingRepository.findGlobalRanking(dateStr, userId);
  }

  async getModelRanking(
    date: Date,
    model: string,
    userId: number,
  ): Promise<BrandRanking[]> {
    const dateStr = this.toDateString(date);
    return this.rankingRepository.findModelRanking(dateStr, model, userId);
  }
}
