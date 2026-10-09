import { Module } from '@nestjs/common';
import { LlmModule } from 'src/llm/llm.module';
import { RankingController } from './ranking.controller';
import { RankingRepository } from './ranking.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { ComputeAllRankingsService } from './service/compute-all-rankings.service';
import { ComputeGlobalRankingService } from './service/compute-global-ranking.service';
import { ComputeModelRankingsService } from './service/compute-model-rankings.service';

@Module({
  imports: [LlmModule, AuthModule],
  providers: [
    ComputeAllRankingsService,
    ComputeGlobalRankingService,
    ComputeModelRankingsService,
    RankingRepository,
    AuthGuard,
  ],
  exports: [RankingRepository, ComputeAllRankingsService],
  controllers: [RankingController],
})
export class RankingModule {}
