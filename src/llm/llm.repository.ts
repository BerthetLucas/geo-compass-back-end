import { Inject, Injectable } from '@nestjs/common';
import { DB, type Database } from 'src/db/db.module';
import { llmResponseTable } from 'src/db/schema';
import { type LlmResponse } from './llm.types';

@Injectable()
export class LlmRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async insertResponses(responses: LlmResponse[]): Promise<void> {
    await this.db.insert(llmResponseTable).values(
      responses.map((response) => ({
        model: response.model,
        response: response.text,
      })),
    );
  }
}
