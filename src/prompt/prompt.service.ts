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
    this.assertValidText(text);

    // New prompts default to isActive:true, so creation also hits the active cap.
    await this.assertUnderActiveCap(userId);

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
      this.assertValidText(updates.text);
    }

    if (updates.isActive === true) {
      // Exclude the prompt being updated so re-activating an already-active
      // prompt (or a no-op save) doesn't count against the cap.
      await this.assertUnderActiveCap(userId, id);
    }

    await this.promptRepository.updatePrompt(id, updates, userId);
  }

  private assertValidText(text: string): void {
    if (!text || text.trim() === '') {
      throw new BadRequestException('Prompt text cannot be empty');
    }
    if (text.length > LLM_LIMITS.maxPromptLen) {
      throw new BadRequestException(
        `Prompt text cannot exceed ${LLM_LIMITS.maxPromptLen} characters`,
      );
    }
  }

  private async assertUnderActiveCap(
    userId: number,
    excludeId?: number,
  ): Promise<void> {
    const activeCount = await this.promptRepository.countActiveByUser(
      userId,
      excludeId,
    );
    if (activeCount >= LLM_LIMITS.maxActivePrompts) {
      throw new BadRequestException(
        `Cannot have more than ${LLM_LIMITS.maxActivePrompts} active prompts`,
      );
    }
  }
}
