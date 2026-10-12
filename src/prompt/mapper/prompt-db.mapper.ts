import {
  type NewPromptRow,
  type PromptRow,
} from 'src/db/schemas/prompts.schema';
import { type Prompt, type PromptUpdate } from '../prompt.types';

export class PromptDbMapper {
  static toDomain(row: PromptRow): Prompt {
    return {
      id: row.id,
      text: row.text,
      isActive: row.isActive,
    };
  }

  static toUpdateRow(update: PromptUpdate): Partial<NewPromptRow> {
    return { text: update.text, isActive: update.isActive };
  }
}
