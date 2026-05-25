import { Inject, Injectable } from '@nestjs/common';
import { type Database, DB } from 'src/db/db.module';
import { promptsTable } from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { type PromptResponse } from './prompt.types';

@Injectable()
export class PromptRepository {
  constructor(@Inject(DB) private db: Database) {}

  async getAllPrompts(): Promise<PromptResponse[]> {
    const rows = await this.db.select().from(promptsTable);

    return rows.map((row) => ({ text: row.text, isActive: row.isActive }));
  }

  async addPrompt(text: string): Promise<void> {
    await this.db.insert(promptsTable).values({ text });
  }

  async deletePrompt(id: number): Promise<void> {
    await this.db.delete(promptsTable).where(eq(promptsTable.id, id));
  }

  async updatePrompt(
    id: number,
    updates: { text?: string; isActive?: boolean },
  ): Promise<void> {
    await this.db
      .update(promptsTable)
      .set(updates)
      .where(eq(promptsTable.id, id));
  }
}
