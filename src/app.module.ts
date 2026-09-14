import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { throttlerConfig } from './common/throttler.config';
import { UserThrottlerGuard } from './common/user-throttler.guard';
import { LlmModule } from './llm/llm.module';
import { GeoModule } from './geo/geo.module';
import { RankingModule } from './ranking/ranking.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { PromptModule } from './prompt/prompt.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(throttlerConfig),
    DbModule,
    LlmModule,
    GeoModule,
    RankingModule,
    PromptModule,
    AuthModule,
    UsersModule,
    ScheduleModule.forRoot(),
    SchedulerModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: UserThrottlerGuard }],
})
export class AppModule {}
