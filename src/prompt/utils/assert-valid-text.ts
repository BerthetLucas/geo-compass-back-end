import { BadRequestException } from '@nestjs/common';
import { LLM_LIMITS } from 'src/llm/constants/limits';

export function assertValidText(text: string): void {
  if (!text || text.trim() === '') {
    throw new BadRequestException('Prompt text cannot be empty');
  }
  if (text.length > LLM_LIMITS.maxPromptLen) {
    throw new BadRequestException(
      `Prompt text cannot exceed ${LLM_LIMITS.maxPromptLen} characters`,
    );
  }
}
