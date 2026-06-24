import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { usersTable } from './users.schema';

export const promptsTable = pgTable('prompts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  text: text().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull(),
});

export const promptsRelations = relations(promptsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [promptsTable.userId],
    references: [usersTable.id],
  }),
}));
