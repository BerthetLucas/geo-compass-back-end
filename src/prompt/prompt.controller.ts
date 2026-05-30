import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PromptService } from './prompt.service';
import { type PromptResponse, type UpdatePromptBody } from './prompt.types';
import { AuthGuard } from '../auth/auth.guard';
import { type JwtPayload } from '../auth/auth.types';

@UseGuards(AuthGuard)
@Controller('prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Get()
  async getAllPrompts(
    @Request() request: { user: JwtPayload },
  ): Promise<PromptResponse[]> {
    return this.promptService.getAllPrompts(request.user.sub);
  }

  @Post()
  async addPrompt(
    @Request() request: { user: JwtPayload },
    @Body('text') text: string,
  ): Promise<void> {
    await this.promptService.addPrompt(request.user.sub, text);
  }

  @Post('delete')
  async deletePrompt(
    @Request() request: { user: JwtPayload },
    @Body('id') id: number,
  ): Promise<void> {
    await this.promptService.deletePrompt(id, request.user.sub);
  }

  @Put(':id')
  async updatePrompt(
    @Request() request: { user: JwtPayload },
    @Param('id') id: number,
    @Body() body: UpdatePromptBody,
  ): Promise<void> {
    await this.promptService.updatePrompt(id, body, request.user.sub);
  }
}
