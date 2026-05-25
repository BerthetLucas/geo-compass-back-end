import { Controller, Body, Post } from '@nestjs/common';
import { LlmService } from './llm.service';
import { type ChatMessage, type LlmResponse } from './llm.types';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('/')
  async handleLlmQuery(
    @Body()
    body: {
      messages: ChatMessage[];
      models: string[];
    },
  ): Promise<LlmResponse[]> {
    const { messages, models } = body;
    return this.llmService.sendLlmQueries(messages, models);
  }
}
