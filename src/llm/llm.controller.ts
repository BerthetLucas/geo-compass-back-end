import { Controller } from '@nestjs/common';
import { LlmResponse, LlmService } from './llm.service';
import { Body, Post } from '@nestjs/common';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('/')
  async handleLlmQuery(
    @Body()
    body: {
      messages: { role: string; content: string }[];
      models: string[];
    },
  ): Promise<LlmResponse[]> {
    const { messages, models } = body;
    return this.llmService.sendLlmQueries(messages, models);
  }
}
