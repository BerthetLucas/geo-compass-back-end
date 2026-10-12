import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LlmController } from './llm.controller';
import { SendLlmQueryService } from './service/send-llm-query.service';
import { SendLlmQueriesService } from './service/send-llm-queries.service';
import { FindResponsesByDateService } from './service/find-responses-by-date.service';
import { LlmRepository } from './llm.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { PromptModule } from 'src/prompt/prompt.module';

@Module({
  imports: [HttpModule, AuthModule, UsersModule, PromptModule],
  providers: [
    SendLlmQueryService,
    SendLlmQueriesService,
    FindResponsesByDateService,
    LlmRepository,
    AuthGuard,
  ],
  exports: [SendLlmQueriesService, FindResponsesByDateService],
  controllers: [LlmController],
})
export class LlmModule {}
