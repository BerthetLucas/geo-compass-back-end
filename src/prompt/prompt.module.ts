import { Module } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { PromptController } from './prompt.controller';
import { PromptRepository } from './prompt.repository';

@Module({
  providers: [PromptService, PromptRepository],
  controllers: [PromptController],
})
export class PromptModule {}
