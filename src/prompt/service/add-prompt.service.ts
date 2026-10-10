import { BadRequestException, Injectable } from '@nestjs/common';
import { PromptRepository } from '../prompt.repository';
import { LLM_LIMITS } from 'src/llm/constants/limits';
import { assertValidText } from '../utils/assert-valid-text';

@Injectable()
export class AddPromptService {
  constructor(private readonly promptRepository: PromptRepository) {}

  async execute(userId: number, text: string): Promise<void> {
    assertValidText(text);

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
}
