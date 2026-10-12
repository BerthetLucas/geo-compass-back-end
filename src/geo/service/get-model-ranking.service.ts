import { Injectable } from '@nestjs/common';
import { type BrandRanking } from 'src/ranking/ranking.types';
import { GeoRepository } from '../geo.repository';

@Injectable()
export class GetModelRankingService {
  constructor(private readonly geoRepository: GeoRepository) {}

  async execute(
    date: Date,
    model: string,
    userId: number,
  ): Promise<BrandRanking[]> {
    return this.geoRepository.findModelRanking(date, model, userId);
  }
}
