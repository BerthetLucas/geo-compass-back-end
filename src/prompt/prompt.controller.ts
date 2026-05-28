import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { type PromptResponse, type UpdatePromptBody } from './prompt.types';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, type JwtPayload } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Get()
  async getAllPrompts(): Promise<PromptResponse[]> {
    return this.promptService.getAllPrompts();
  }

  @Post()
  async addPrompt(
    @CurrentUser() user: JwtPayload,
    @Body('text') text: string,
  ): Promise<void> {
    await this.promptService.addPrompt(user.sub, text);
  }

  @Post('delete')
  async deletePrompt(@Body('id') id: number): Promise<void> {
    await this.promptService.deletePrompt(id);
  }

  @Put(':id')
  async updatePrompt(
    @Param('id') id: number,
    @Body() body: UpdatePromptBody,
  ): Promise<void> {
    await this.promptService.updatePrompt(id, body);
  }
}
