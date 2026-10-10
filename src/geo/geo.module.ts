import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoRepository } from './geo.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { GetGlobalRankingService } from './service/get-global-ranking.service';
import { GetAvailableModelsService } from './service/get-available-models.service';
import { GetModelRankingService } from './service/get-model-ranking.service';
import { GetRankingByPeriodService } from './service/get-ranking-by-period.service';

@Module({
  imports: [AuthModule],
  providers: [
    GetGlobalRankingService,
    GetAvailableModelsService,
    GetModelRankingService,
    GetRankingByPeriodService,
    GeoRepository,
    AuthGuard,
  ],
  controllers: [GeoController],
  exports: [GetGlobalRankingService],
})
export class GeoModule {}
