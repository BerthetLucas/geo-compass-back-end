import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const promptsTable = pgTable('prompts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  text: text().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull(),
});
