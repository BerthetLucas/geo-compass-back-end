import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { type JwtPayload } from 'src/auth/auth.types';
import { AuthGuard } from 'src/auth/auth.guard';
import { AVAILABLE_MODELS } from './constants/models';
import { SendLlmQueriesService } from './service/send-llm-queries.service';
import { type LlmResponseDto } from './dto/llm.dto';
import { LlmMapper } from './mapper/llm.mapper';

@UseGuards(AuthGuard)
@Controller('llm')
export class LlmController {
  constructor(private readonly sendLlmQueriesService: SendLlmQueriesService) {}

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
  ): Promise<LlmResponseDto[]> {
    const responses = await this.sendLlmQueriesService.execute(
      request.user.sub,
    );
    return responses.map((r) => LlmMapper.toDto(r));
  }
}
