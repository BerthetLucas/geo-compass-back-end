import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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

  // 5 runs / day / user (keyed by verified JWT sub via UserThrottlerGuard).
  // Business use is ~1/day.
  @Throttle({ default: { limit: 5, ttl: 86_400_000 } })
  @Post('/')
  async handleLlmQuery(
    @Request() request: { user: JwtPayload },
  ): Promise<LlmResponse[]> {
    return this.llmService.sendLlmQueries(request.user.sub);
  }
}
