import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LlmController } from './llm.controller';
import { SendLlmQueryService } from './service/send-llm-query.service';
import { SendLlmQueriesService } from './service/send-llm-queries.service';
import { LlmRepository } from './llm.repository';
import { PromptRepository } from 'src/prompt/prompt.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from 'src/users/users.module';
@Module({
  imports: [HttpModule, AuthModule, UsersModule],
  providers: [
    SendLlmQueryService,
    SendLlmQueriesService,
    LlmRepository,
    PromptRepository,
    AuthGuard,
  ],
  exports: [SendLlmQueriesService, LlmRepository],
  controllers: [LlmController],
})
export class LlmModule {}
