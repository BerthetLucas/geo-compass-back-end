import { Inject, Injectable } from '@nestjs/common';
import { type Database, DB } from 'src/db/db.module';
import { promptsTable } from 'src/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { type PromptResponse } from './prompt.types';

@Injectable()
export class PromptRepository {
  constructor(@Inject(DB) private db: Database) {}

  async getAllPrompts(userId: number): Promise<PromptResponse[]> {
    const rows = await this.db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.userId, userId));

    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      isActive: row.isActive,
    }));
  }

  async getActivePrompts(userId: number): Promise<PromptResponse[]> {
    const rows = await this.db
      .select()
      .from(promptsTable)
      .where(
        and(eq(promptsTable.userId, userId), eq(promptsTable.isActive, true)),
      );

    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      isActive: row.isActive,
    }));
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

  // Cap check + insert as one round trip, so the count and the write share the
  // same statement instead of racing across two separate HTTP calls (neon-http
  // has no session/transaction, so this is as atomic as this driver gets).
  // ponytail: still not airtight under two *simultaneous* statements — add a
  // Postgres trigger with pg_advisory_xact_lock if the cap must be a hard
  // invariant rather than best-effort.
  async addPromptIfUnderCap(
    userId: number,
    text: string,
    cap: number,
  ): Promise<boolean> {
    const result = await this.db.execute<{ id: number }>(sql`
      insert into ${promptsTable} ("userId", "text")
      select ${userId}, ${text}
      where (
        select count(*) from ${promptsTable}
        where "userId" = ${userId} and "isActive" = true
      ) < ${cap}
      returning "id"
    `);
    return result.rows.length > 0;
  }

  // Same one-round-trip cap check, for re-activating an existing prompt.
  async activatePromptIfUnderCap(
    id: number,
    userId: number,
    cap: number,
    text?: string,
  ): Promise<boolean> {
    const result = await this.db.execute<{ id: number }>(sql`
      update ${promptsTable}
      set "isActive" = true${text === undefined ? sql`` : sql`, "text" = ${text}`}
      where "id" = ${id} and "userId" = ${userId} and (
        select count(*) from ${promptsTable}
        where "userId" = ${userId} and "isActive" = true and "id" != ${id}
      ) < ${cap}
      returning "id"
    `);
    return result.rows.length > 0;
  }
}
