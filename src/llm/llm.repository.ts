import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte } from 'drizzle-orm';
import { DB, type Database } from 'src/db/db.module';
import { llmResponseTable } from 'src/db/schema';
import { type LlmResponse, type StoredLlmResponse } from './llm.types';
import { LlmDbMapper } from './mapper/llm-db.mapper';

@Injectable()
export class LlmRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async insertResponses(
    userId: number,
    responses: LlmResponse[],
  ): Promise<void> {
    await this.db
      .insert(llmResponseTable)
      .values(
        responses.map((response) => LlmDbMapper.toInsertRow(userId, response)),
      );
  }

  async findResponsesByDate(
    date: Date,
    userId: number,
  ): Promise<StoredLlmResponse[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const rows = await this.db
      .select()
      .from(llmResponseTable)
      .where(
        and(
          gte(llmResponseTable.createdAt, startOfDay),
          lte(llmResponseTable.createdAt, endOfDay),
          eq(llmResponseTable.userId, userId),
        ),
      );

    return rows.map((row) => LlmDbMapper.toStoredResponse(row));
  }
}
