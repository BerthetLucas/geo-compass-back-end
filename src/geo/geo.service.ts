import { Injectable } from '@nestjs/common';
import { type BrandRanking, type DailyRanking } from '../ranking/ranking.types';
import { GeoRepository } from './geo.repository';

@Injectable()
export class GeoService {
  constructor(private readonly geoRepository: GeoRepository) {}

  async getGlobalRanking(date: Date, userId: number): Promise<BrandRanking[]> {
    const dateStr = this.toDateString(date);
    return this.geoRepository.findGlobalRanking(dateStr, userId);
  }

  async getAvailableModels(date: Date, userId: number): Promise<string[]> {
    const dateStr = this.toDateString(date);
    return this.geoRepository.findAvailableModels(dateStr, userId);
  }

  async getModelRanking(
    date: Date,
    model: string,
    userId: number,
  ): Promise<BrandRanking[]> {
    const dateStr = this.toDateString(date);
    return this.geoRepository.findModelRanking(dateStr, model, userId);
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async getRankingByPeriod(
    startDate: Date,
    endDate: Date,
    userId: number,
  ): Promise<DailyRanking[]> {
    const startDateStr = this.toDateString(startDate);
    const endDateStr = this.toDateString(endDate);
    return this.geoRepository.findRankingByPeriod(
      startDateStr,
      endDateStr,
      userId,
    );
  }
}
