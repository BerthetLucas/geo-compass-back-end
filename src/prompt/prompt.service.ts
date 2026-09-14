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

    // New prompts default to isActive:true, so creation also hits the active
    // cap — checked and inserted in one DB round trip (see repository).
    const created = await this.promptRepository.addPromptIfUnderCap(
      userId,
      text,
      LLM_LIMITS.maxActivePrompts,
    );
    if (!created) {
      throw new BadRequestException(
        `Cannot have more than ${LLM_LIMITS.maxActivePrompts} active prompts`,
      );
    }
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
      // prompt (or a no-op save) doesn't count against the cap. Checked and
      // written in one DB round trip (see repository) to close the race.
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
}
