import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GeoService } from './geo.service';
import { AuthGuard } from '../auth/auth.guard';
import { type JwtPayload } from '../auth/auth.types';
import { type BrandRanking, type DailyRanking } from '../ranking/ranking.types';

@UseGuards(AuthGuard)
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('global')
  async getGlobalRanking(
    @Request() request: { user: JwtPayload },
    @Query('date') dateParam?: string,
  ): Promise<BrandRanking[]> {
    const date = dateParam ?? new Date().toISOString().split('T')[0];
    return this.geoService.getGlobalRanking(new Date(date), request.user.sub);
  }

  @Get('model/:model')
  async getModelRanking(
    @Request() request: { user: JwtPayload },
    @Param('model') model: string,
    @Query('date') dateParam?: string,
  ): Promise<BrandRanking[]> {
    const date = dateParam ?? new Date().toISOString().split('T')[0];
    return this.geoService.getModelRanking(
      new Date(date),
      model,
      request.user.sub,
    );
  }

  @Get('period')
  async getRankingByPeriod(
    @Request() request: { user: JwtPayload },
    @Query('startDate') startDateParam: string,
    @Query('endDate') endDateParam: string,
  ): Promise<DailyRanking[]> {
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    return this.geoService.getRankingByPeriod(
      startDate,
      endDate,
      request.user.sub,
    );
  }
}
