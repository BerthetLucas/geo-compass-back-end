import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte } from 'drizzle-orm';
import { DB, type Database } from 'src/db/db.module';
import { llmResponseTable } from 'src/db/schema';
import { type LlmResponse } from './llm.types';

@Injectable()
export class LlmRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async insertResponses(
    userId: number,
    responses: LlmResponse[],
  ): Promise<void> {
    await this.db.insert(llmResponseTable).values(
      responses.map((response) => ({
        userId,
        model: response.model,
        response: response.text,
      })),
    );
  }

  async findResponsesByDate(date: Date, userId: number) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.db
      .select()
      .from(llmResponseTable)
      .where(
        and(
          gte(llmResponseTable.createdAt, startOfDay),
          lte(llmResponseTable.createdAt, endOfDay),
          eq(llmResponseTable.userId, userId),
        ),
      );
  }
}
