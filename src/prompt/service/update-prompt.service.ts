import { BadRequestException, Injectable } from '@nestjs/common';
import { PromptRepository } from '../prompt.repository';
import { type PromptUpdate } from '../prompt.types';
import { LLM_LIMITS } from 'src/llm/constants/limits';

@Injectable()
export class UpdatePromptService {
  constructor(private readonly promptRepository: PromptRepository) {}

  async execute(
    id: number,
    updates: PromptUpdate,
    userId: number,
  ): Promise<void> {
    if (updates.isActive === true) {
      const activated = await this.promptRepository.activatePromptIfUnderCap(
        id,
        userId,
        LLM_LIMITS.maxActivePrompts,
        updates.text,
      );
      if (!activated) {
        throw new BadRequestException(
          `Cannot have more than ${LLM_LIMITS.maxActivePrompts} active prompts`,
        );
      }
      return;
    }

    await this.promptRepository.updatePrompt(id, updates, userId);
  }
}
