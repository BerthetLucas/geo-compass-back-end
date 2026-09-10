import { BadRequestException, Injectable } from '@nestjs/common';
import { PromptRepository } from './prompt.repository';
import { type PromptResponse } from './prompt.types';
import { LLM_LIMITS } from 'src/llm/constants/limits';

@Injectable()
export class PromptService {
  constructor(private readonly promptRepository: PromptRepository) {}

  async getAllPrompts(userId: number): Promise<PromptResponse[]> {
    return this.promptRepository.getAllPrompts(userId);
  }

  async addPrompt(userId: number, text: string): Promise<void> {
    if (!text || text.trim() === '') {
      throw new BadRequestException('Prompt text cannot be empty');
    }
    if (text.length > LLM_LIMITS.maxPromptLen) {
      throw new BadRequestException(
        `Prompt text cannot exceed ${LLM_LIMITS.maxPromptLen} characters`,
      );
    }

    // New prompts default to isActive:true, so this is also the active-prompt cap
    // for creation (security report 3.1 / cyber-verdict-nodb.md §3).
    const activeCount = await this.promptRepository.countActiveByUser(userId);
    if (activeCount >= LLM_LIMITS.maxActivePrompts) {
      throw new BadRequestException(
        `Cannot have more than ${LLM_LIMITS.maxActivePrompts} active prompts`,
      );
    }

    await this.promptRepository.addPrompt(userId, text);
  }

  async deletePrompt(id: number, userId: number): Promise<void> {
    await this.promptRepository.deletePrompt(id, userId);
  }

  async updatePrompt(
    id: number,
    updates: { text?: string; isActive?: boolean },
    userId: number,
  ): Promise<void> {
    if (updates.text !== undefined) {
      if (updates.text.trim() === '') {
        throw new BadRequestException('Prompt text cannot be empty');
      }
      if (updates.text.length > LLM_LIMITS.maxPromptLen) {
        throw new BadRequestException(
          `Prompt text cannot exceed ${LLM_LIMITS.maxPromptLen} characters`,
        );
      }
    }

    if (updates.isActive === true) {
      // Exclude the prompt being updated: re-activating an already-active prompt
      // (or a no-op save) must not trip the cap (cyber-review.md N1).
      const activeCount = await this.promptRepository.countActiveByUser(
        userId,
        id,
      );
      if (activeCount >= LLM_LIMITS.maxActivePrompts) {
        throw new BadRequestException(
          `Cannot have more than ${LLM_LIMITS.maxActivePrompts} active prompts`,
        );
      }
    }

    await this.promptRepository.updatePrompt(id, updates, userId);
  }
}
