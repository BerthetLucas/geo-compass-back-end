import { Injectable } from '@nestjs/common';
import { type BrandRanking } from 'src/ranking/ranking.types';
import { toDateString } from 'src/common/to-date-string';
import { GeoRepository } from '../geo.repository';

@Injectable()
export class GetModelRankingService {
  constructor(private readonly geoRepository: GeoRepository) {}

  async execute(
    date: Date,
    model: string,
    userId: number,
  ): Promise<BrandRanking[]> {
    return this.geoRepository.findModelRanking(
      toDateString(date),
      model,
      userId,
    );
  }
}
