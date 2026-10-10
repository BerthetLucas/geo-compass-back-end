import { Controller, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { type JwtPayload } from '../auth/auth.types';
import { ComputeAllRankingsService } from './service/compute-all-rankings.service';
import {
  ComputeRankingQueryDto,
  type ComputeRankingResponseDto,
} from './dto/ranking.dto';
import { RankingMapper } from './mapper/ranking.mapper';

@UseGuards(AuthGuard)
@Controller('ranking')
export class RankingController {
  constructor(
    private readonly computeAllRankingsService: ComputeAllRankingsService,
  ) {}

  @Post('compute')
  async computeRanking(
    @Request() request: { user: JwtPayload },
    @Query() query: ComputeRankingQueryDto,
  ): Promise<ComputeRankingResponseDto> {
    const date = RankingMapper.fromDto(query);
    await this.computeAllRankingsService.execute(request.user.sub, date);
    return RankingMapper.toDto(date);
  }
}
