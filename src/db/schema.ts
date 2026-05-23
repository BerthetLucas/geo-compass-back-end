import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';

export const llmResponseTable = pgTable('llm_responses', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  model: varchar({ length: 255 }).notNull(),
  response: varchar({ length: 255 }).notNull(),
  createdAt: integer().notNull(),
});
