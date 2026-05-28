import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { promptsTable } from './prompts.schema';
import { llmResponseTable } from './llm-response.schema';
import { globalRankingsTable, modelRankingsTable } from './rankings.schema';

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  prompts: many(promptsTable),
  llmResponses: many(llmResponseTable),
  globalRankings: many(globalRankingsTable),
  modelRankings: many(modelRankingsTable),
}));
