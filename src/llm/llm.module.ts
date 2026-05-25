import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { LlmRepository } from './llm.repository';

@Module({
  imports: [HttpModule],
  providers: [LlmService, LlmRepository],
  exports: [LlmService],
  controllers: [LlmController],
})
export class LlmModule {}
