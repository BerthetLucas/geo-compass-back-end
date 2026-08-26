import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { LlmService } from './llm.service';
import { type LlmResponse } from './llm.types';
import { type JwtPayload } from 'src/auth/auth.types';
import { AuthGuard } from 'src/auth/auth.guard';
import { AVAILABLE_MODELS } from './constants/models';

@UseGuards(AuthGuard)
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('models')
  getAvailableModels(): string[] {
    return AVAILABLE_MODELS;
  }

  @Post('/')
  async handleLlmQuery(
    @Request() request: { user: JwtPayload },
  ): Promise<LlmResponse[]> {
    return this.llmService.sendLlmQueries(request.user.sub);
  }
}
