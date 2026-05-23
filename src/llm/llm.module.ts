import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { HttpModule } from '@nestjs/axios';
import { LlmController } from './llm.controller';

@Module({
  imports: [HttpModule],
  providers: [LlmService],
  exports: [LlmService],
  controllers: [LlmController],
})
export class LlmModule {}
