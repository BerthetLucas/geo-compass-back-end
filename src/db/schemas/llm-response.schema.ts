import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm/relations';
import { usersTable } from '../schema';

export const llmResponseTable = pgTable('llm_responses', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  model: varchar({ length: 255 }).notNull(),
  response: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const llmResponseTableRelation = relations(
  llmResponseTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [llmResponseTable.userId],
      references: [usersTable.id],
    }),
  }),
);
