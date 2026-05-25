import { Injectable } from '@nestjs/common';
import { type BrandRanking } from './geo.types';
import { GeoRepository } from './geo.repository';
import { extractBrands } from './utils/extract-brands';
import { countMentions } from './utils/count-mentions';
import { buildRanking } from './utils/build-ranking';

@Injectable()
export class GeoService {
  constructor(private readonly geoRepository: GeoRepository) {}

  async getDailyGlobalBrandRanking(): Promise<BrandRanking[]> {
    const todayResponses = await this.geoRepository.findTodayResponses();
    const allBrands = extractBrands(todayResponses);
    const mentionCounts = countMentions(allBrands);
    return buildRanking(mentionCounts);
  }

  async getDailyResponseByModel(model: string): Promise<BrandRanking[]> {
    const todayResponses =
      await this.geoRepository.findTodayResponsesByModel(model);
    const allBrands = extractBrands(todayResponses);
    const mentionCounts = countMentions(allBrands);
    return buildRanking(mentionCounts);
  }
}
