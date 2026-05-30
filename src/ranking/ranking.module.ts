import { Module } from '@nestjs/common';
import { LlmModule } from 'src/llm/llm.module';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { RankingRepository } from './ranking.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [LlmModule, AuthModule],
  providers: [RankingService, RankingRepository, AuthGuard],
  controllers: [RankingController],
})
export class RankingModule {}
