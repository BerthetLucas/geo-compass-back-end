import { Controller, Body, Post } from '@nestjs/common';
import { LlmService } from './llm.service';
import { type LlmResponse } from './llm.types';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('/')
  async handleLlmQuery(
    @Body() body: { models: string[] },
  ): Promise<LlmResponse[]> {
    return this.llmService.sendLlmQueries(body.models);
  }
}
