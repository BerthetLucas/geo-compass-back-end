import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { LlmService } from './llm.service';
import { type LlmResponse } from './llm.types';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, type JwtPayload } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('/')
  async handleLlmQuery(
    @CurrentUser() user: JwtPayload,
    @Body() body: { models: string[] },
  ): Promise<LlmResponse[]> {
    return this.llmService.sendLlmQueries(user.sub, body.models);
  }
}
