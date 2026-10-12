import {
  type LlmResponseRow,
  type NewLlmResponseRow,
} from 'src/db/schemas/llm-response.schema';
import { type LlmResponse, type StoredLlmResponse } from '../llm.types';

export class LlmDbMapper {
  static toInsertRow(userId: number, response: LlmResponse): NewLlmResponseRow {
    return {
      userId,
      model: response.model,
      response: response.text,
      promptId: response.promptId,
    };
  }

  static toStoredResponse(row: LlmResponseRow): StoredLlmResponse {
    return { model: row.model, text: row.response };
  }
}
