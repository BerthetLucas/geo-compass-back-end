import { Injectable } from '@nestjs/common';
import { type DailyRanking } from 'src/ranking/ranking.types';
import { GeoRepository } from '../geo.repository';

@Injectable()
export class GetRankingByPeriodService {
  constructor(private readonly geoRepository: GeoRepository) {}

  async execute(
    startDate: Date,
    endDate: Date,
    userId: number,
  ): Promise<DailyRanking[]> {
    return this.geoRepository.findRankingByPeriod(startDate, endDate, userId);
  }
}
