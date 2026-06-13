import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { UsersModule } from 'src/users/users.module';
import { RankingModule } from 'src/ranking/ranking.module';
import { LlmModule } from 'src/llm/llm.module';

@Module({
  imports: [UsersModule, RankingModule, LlmModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
