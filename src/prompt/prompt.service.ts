import { Injectable } from '@nestjs/common';
import { PromptRepository } from './prompt.repository';
import { type PromptResponse } from './prompt.types';

@Injectable()
export class PromptService {
  constructor(private readonly promptRepository: PromptRepository) {}

  async getAllPrompts(): Promise<PromptResponse[]> {
    return this.promptRepository.getAllPrompts();
  }

  async addPrompt(text: string): Promise<void> {
    if (!text || text.trim() === '') {
      throw new Error('Prompt text cannot be empty');
    }

    await this.promptRepository.addPrompt(text);
  }

  async deletePrompt(id: number): Promise<void> {
    await this.promptRepository.deletePrompt(id);
  }

  async updatePrompt(
    id: number,
    updates: { text?: string; isActive?: boolean },
  ): Promise<void> {
    if (updates.text !== undefined && updates.text.trim() === '') {
      throw new Error('Prompt text cannot be empty');
    }
    await this.promptRepository.updatePrompt(id, updates);
  }
}
