import { Injectable } from '@nestjs/common';
import { PromptRepository } from '../prompt.repository';
import { type Prompt } from '../prompt.types';

@Injectable()
export class GetAllPromptsService {
  constructor(private readonly promptRepository: PromptRepository) {}

  async execute(userId: number): Promise<Prompt[]> {
    return this.promptRepository.getAllPrompts(userId);
  }
}
