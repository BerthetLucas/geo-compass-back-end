import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { LlmRepository } from './llm.repository';
import { PromptRepository } from 'src/prompt/prompt.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [LlmService, LlmRepository, PromptRepository, AuthGuard],
  exports: [LlmService],
  controllers: [LlmController],
})
export class LlmModule {}
