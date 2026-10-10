import { Module } from '@nestjs/common';
import { PromptController } from './prompt.controller';
import { PromptRepository } from './prompt.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { GetAllPromptsService } from './service/get-all-prompts.service';
import { AddPromptService } from './service/add-prompt.service';
import { DeletePromptService } from './service/delete-prompt.service';
import { UpdatePromptService } from './service/update-prompt.service';

@Module({
  imports: [AuthModule],
  providers: [
    GetAllPromptsService,
    AddPromptService,
    DeletePromptService,
    UpdatePromptService,
    PromptRepository,
    AuthGuard,
  ],
  controllers: [PromptController],
})
export class PromptModule {}
