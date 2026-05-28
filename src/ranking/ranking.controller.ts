import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingRepository } from './ranking.repository';
import { type BrandRanking } from 'src/geo/geo.types';

@Controller('ranking')
export class RankingController {
  constructor(
    private readonly rankingService: RankingService,
    private readonly rankingRepository: RankingRepository,
  ) {}

  @Post('compute')
  async computeRanking(
    @Query('date') dateParam?: string,
  ): Promise<{ success: boolean; date: string }> {
    const date = dateParam ? new Date(dateParam) : new Date();
    await this.rankingService.computeAndStoreAllRankings(user.sub, date);
    return { success: true, date: date.toISOString().split('T')[0] };
  }

  @Get('global')
  async getGlobalRanking(
    @Query('date') dateParam?: string,
  ): Promise<BrandRanking[]> {
    const date = dateParam ?? new Date().toISOString().split('T')[0];
    return this.rankingRepository.findGlobalRanking(date);
  }

  @Get('model/:model')
  async getModelRanking(
    @Param('model') model: string,
    @Query('date') dateParam?: string,
  ): Promise<BrandRanking[]> {
    const date = dateParam ?? new Date().toISOString().split('T')[0];
    return this.rankingRepository.findModelRanking(date, model);
  }
}
