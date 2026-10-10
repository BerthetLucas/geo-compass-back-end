import { Injectable } from '@nestjs/common';
import { type BrandRanking } from 'src/ranking/ranking.types';
import { toDateString } from 'src/common/to-date-string';
import { GeoRepository } from '../geo.repository';

@Injectable()
export class GetGlobalRankingService {
  constructor(private readonly geoRepository: GeoRepository) {}

  async execute(date: Date, userId: number): Promise<BrandRanking[]> {
    return this.geoRepository.findGlobalRanking(toDateString(date), userId);
  }
}
