import { Controller, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { type JwtPayload } from '../auth/auth.types';
import { ComputeAllRankingsService } from './service/compute-all-rankings.service';
import {
  ComputeRankingQueryDto,
  type ComputeRankingResponseDto,
} from './dto/ranking.dto';
import { RankingDtoMapper } from './mapper/ranking-dto.mapper';

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
    const date = RankingDtoMapper.fromDto(query);
    await this.computeAllRankingsService.execute(request.user.sub, date);
    return RankingDtoMapper.toDto(date);
  }
}
