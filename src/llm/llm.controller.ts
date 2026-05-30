import { Controller, Body, Post, UseGuards, Request } from '@nestjs/common';
import { LlmService } from './llm.service';
import { type LlmResponse } from './llm.types';
import { type JwtPayload } from 'src/auth/auth.types';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('/')
  async handleLlmQuery(
    @Body() body: { models: string[] },
    @Request() request: { user: JwtPayload },
  ): Promise<LlmResponse[]> {
    return this.llmService.sendLlmQueries(request.user.sub, body.models);
  }
}
