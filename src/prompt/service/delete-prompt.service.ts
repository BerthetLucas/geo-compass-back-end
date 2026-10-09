import { Injectable } from '@nestjs/common';
import { PromptRepository } from '../prompt.repository';

@Injectable()
export class DeletePromptService {
  constructor(private readonly promptRepository: PromptRepository) {}

  async execute(id: number, userId: number): Promise<void> {
    await this.promptRepository.deletePrompt(id, userId);
  }
}
