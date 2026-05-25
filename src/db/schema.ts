import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const llmResponseTable = pgTable('llm_responses', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  model: varchar({ length: 255 }).notNull(),
  response: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
