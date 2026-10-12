import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { type JwtPayload } from '../auth/auth.types';
import { GetGlobalRankingService } from './service/get-global-ranking.service';
import { GetAvailableModelsService } from './service/get-available-models.service';
import { GetModelRankingService } from './service/get-model-ranking.service';
import { GetRankingByPeriodService } from './service/get-ranking-by-period.service';
import {
  type BrandRankingDto,
  type DailyRankingDto,
  DateQueryDto,
  ModelParamDto,
  PeriodQueryDto,
} from './dto/geo.dto';
import { GeoDtoMapper } from './mapper/geo-dto.mapper';

@UseGuards(AuthGuard)
@Controller('geo')
export class GeoController {
  constructor(
    private readonly getGlobalRankingService: GetGlobalRankingService,
    private readonly getAvailableModelsService: GetAvailableModelsService,
    private readonly getModelRankingService: GetModelRankingService,
    private readonly getRankingByPeriodService: GetRankingByPeriodService,
  ) {}

  @Get('global')
  async getGlobalRanking(
    @Request() request: { user: JwtPayload },
    @Query() query: DateQueryDto,
  ): Promise<BrandRankingDto[]> {
    const rankings = await this.getGlobalRankingService.execute(
      GeoDtoMapper.fromDateQuery(query),
      request.user.sub,
    );
    return rankings.map((r) => GeoDtoMapper.toBrandRankingDto(r));
  }

  @Get('models')
  async getAvailableModels(
    @Request() request: { user: JwtPayload },
    @Query() query: DateQueryDto,
  ): Promise<string[]> {
    return this.getAvailableModelsService.execute(
      GeoDtoMapper.fromDateQuery(query),
      request.user.sub,
    );
  }

  @Get('model/:model')
  async getModelRanking(
    @Request() request: { user: JwtPayload },
    @Param() params: ModelParamDto,
    @Query() query: DateQueryDto,
  ): Promise<BrandRankingDto[]> {
    const rankings = await this.getModelRankingService.execute(
      GeoDtoMapper.fromDateQuery(query),
      params.model,
      request.user.sub,
    );
    return rankings.map((r) => GeoDtoMapper.toBrandRankingDto(r));
  }

  @Get('period')
  async getRankingByPeriod(
    @Request() request: { user: JwtPayload },
    @Query() query: PeriodQueryDto,
  ): Promise<DailyRankingDto[]> {
    const { startDate, endDate } = GeoDtoMapper.fromPeriodQuery(query);
    const rankings = await this.getRankingByPeriodService.execute(
      startDate,
      endDate,
      request.user.sub,
    );
    return rankings.map((r) => GeoDtoMapper.toDailyRankingDto(r));
  }
}
