import { Inject, Injectable } from '@nestjs/common';
import { type Database, DB } from 'src/db/db.module';
import { promptsTable } from 'src/db/schema';
import { and, eq } from 'drizzle-orm';
import { type PromptResponse } from './prompt.types';

@Injectable()
export class PromptRepository {
  constructor(@Inject(DB) private db: Database) {}

  async getAllPrompts(userId: number): Promise<PromptResponse[]> {
    const rows = await this.db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.userId, userId));

    return rows.map((row) => ({ text: row.text, isActive: row.isActive }));
  }

  async getActivePrompts(userId: number): Promise<PromptResponse[]> {
    const rows = await this.db
      .select()
      .from(promptsTable)
      .where(
        and(eq(promptsTable.userId, userId), eq(promptsTable.isActive, true)),
      );

    return rows.map((row) => ({ text: row.text, isActive: row.isActive }));
  }

  async addPrompt(userId: number, text: string): Promise<void> {
    await this.db.insert(promptsTable).values({ userId, text });
  }

  async deletePrompt(id: number, userId: number): Promise<void> {
    await this.db
      .delete(promptsTable)
      .where(and(eq(promptsTable.id, id), eq(promptsTable.userId, userId)));
  }

  async updatePrompt(
    id: number,
    updates: { text?: string; isActive?: boolean },
    userId: number,
  ): Promise<void> {
    await this.db
      .update(promptsTable)
      .set(updates)
      .where(and(eq(promptsTable.id, id), eq(promptsTable.userId, userId)));
  }
}
