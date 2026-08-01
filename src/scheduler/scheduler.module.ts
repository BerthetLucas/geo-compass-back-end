import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { UsersModule } from 'src/users/users.module';
import { RankingModule } from 'src/ranking/ranking.module';
import { LlmModule } from 'src/llm/llm.module';
import { GeoModule } from 'src/geo/geo.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [UsersModule, RankingModule, LlmModule, GeoModule, EmailModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
