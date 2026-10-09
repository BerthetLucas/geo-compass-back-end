import { type Prompt, type PromptUpdate } from '../prompt.types';
import {
  type CreatePromptDto,
  PromptDto,
  type UpdatePromptDto,
} from '../dto/prompt.dto';

export class PromptMapper {
  static fromCreateDto(dto: CreatePromptDto): string {
    return dto.text;
  }

  static fromUpdateDto(dto: UpdatePromptDto): PromptUpdate {
    return { text: dto.text, isActive: dto.isActive };
  }

  static toDto(prompt: Prompt): PromptDto {
    const dto = new PromptDto();
    dto.id = prompt.id;
    dto.text = prompt.text;
    dto.isActive = prompt.isActive;
    return dto;
  }
}
