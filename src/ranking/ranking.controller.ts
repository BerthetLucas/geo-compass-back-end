import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RankingService } from './ranking.service';
import { type BrandRanking } from 'src/geo/geo.types';
import { AuthGuard } from '../auth/auth.guard';
import { type JwtPayload } from '../auth/auth.types';

@UseGuards(AuthGuard)
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Post('compute')
  async computeRanking(
    @Request() request: { user: JwtPayload },
    @Query('date') dateParam?: string,
  ): Promise<{ success: boolean; date: string }> {
    const date = dateParam ? new Date(dateParam) : new Date();
    await this.rankingService.computeAndStoreAllRankings(
      request.user.sub,
      date,
    );
    return { success: true, date: date.toISOString().split('T')[0] };
  }

  @Get('global')
  async getGlobalRanking(
    @Request() request: { user: JwtPayload },
    @Query('date') dateParam?: string,
  ): Promise<BrandRanking[]> {
    const date = dateParam ?? new Date().toISOString().split('T')[0];
    return this.rankingService.getGlobalRanking(
      new Date(date),
      request.user.sub,
    );
  }

  @Get('model/:model')
  async getModelRanking(
    @Request() request: { user: JwtPayload },
    @Param('model') model: string,
    @Query('date') dateParam?: string,
  ): Promise<BrandRanking[]> {
    const date = dateParam ?? new Date().toISOString().split('T')[0];
    return this.rankingService.getModelRanking(
      new Date(date),
      model,
      request.user.sub,
    );
  }
}
