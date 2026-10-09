import { type LlmResponse } from '../llm.types';
import { LlmResponseDto } from '../dto/llm.dto';

export class LlmMapper {
  static toDto(response: LlmResponse): LlmResponseDto {
    const dto = new LlmResponseDto();
    dto.model = response.model;
    dto.text = response.text;
    dto.durationMs = response.durationMs;
    return dto;
  }
}
