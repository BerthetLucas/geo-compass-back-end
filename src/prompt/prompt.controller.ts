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
import { AuthGuard } from '../auth/auth.guard';
import { type JwtPayload } from '../auth/auth.types';
import { GetAllPromptsService } from './service/get-all-prompts.service';
import { AddPromptService } from './service/add-prompt.service';
import { DeletePromptService } from './service/delete-prompt.service';
import { UpdatePromptService } from './service/update-prompt.service';
import {
  CreatePromptDto,
  DeletePromptDto,
  type PromptDto,
  PromptIdParamDto,
  UpdatePromptDto,
} from './dto/prompt.dto';
import { PromptMapper } from './mapper/prompt.mapper';

@UseGuards(AuthGuard)
@Controller('prompt')
export class PromptController {
  constructor(
    private readonly getAllPromptsService: GetAllPromptsService,
    private readonly addPromptService: AddPromptService,
    private readonly deletePromptService: DeletePromptService,
    private readonly updatePromptService: UpdatePromptService,
  ) {}

  @Get()
  async getAllPrompts(
    @Request() request: { user: JwtPayload },
  ): Promise<PromptDto[]> {
    const prompts = await this.getAllPromptsService.execute(request.user.sub);
    return prompts.map((prompt) => PromptMapper.toDto(prompt));
  }

  @Post()
  async addPrompt(
    @Request() request: { user: JwtPayload },
    @Body() dto: CreatePromptDto,
  ): Promise<void> {
    await this.addPromptService.execute(
      request.user.sub,
      PromptMapper.fromCreateDto(dto),
    );
  }

  @Post('delete')
  async deletePrompt(
    @Request() request: { user: JwtPayload },
    @Body() dto: DeletePromptDto,
  ): Promise<void> {
    await this.deletePromptService.execute(dto.id, request.user.sub);
  }

  @Put(':id')
  async updatePrompt(
    @Request() request: { user: JwtPayload },
    @Param() params: PromptIdParamDto,
    @Body() dto: UpdatePromptDto,
  ): Promise<void> {
    await this.updatePromptService.execute(
      params.id,
      PromptMapper.fromUpdateDto(dto),
      request.user.sub,
    );
  }
}
