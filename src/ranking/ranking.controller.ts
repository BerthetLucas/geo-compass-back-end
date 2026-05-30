import { Controller, Post, Query, Request, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
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
}
