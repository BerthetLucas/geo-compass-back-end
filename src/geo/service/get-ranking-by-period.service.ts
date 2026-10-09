import { Injectable } from '@nestjs/common';
import { type DailyRanking } from 'src/ranking/ranking.types';
import { toDateString } from 'src/common/to-date-string';
import { GeoRepository } from '../geo.repository';

@Injectable()
export class GetRankingByPeriodService {
  constructor(private readonly geoRepository: GeoRepository) {}

  async execute(
    startDate: Date,
    endDate: Date,
    userId: number,
  ): Promise<DailyRanking[]> {
    return this.geoRepository.findRankingByPeriod(
      toDateString(startDate),
      toDateString(endDate),
      userId,
    );
  }
}
