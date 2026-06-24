import { date, index, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm/relations';
import { usersTable } from '../schema';

export const globalRankingsTable = pgTable(
  'global_rankings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    date: date().notNull(),
    brand: varchar({ length: 255 }).notNull(),
    mentions: integer().notNull(),
    rank: integer().notNull(),
  },
  (table) => [index('global_rankings_date_idx').on(table.date)],
);

export const globalBrandRankingsTableRelation = relations(
  globalRankingsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [globalRankingsTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export const modelRankingsTable = pgTable(
  'model_rankings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    date: date().notNull(),
    model: varchar({ length: 255 }).notNull(),
    brand: varchar({ length: 255 }).notNull(),
    mentions: integer().notNull(),
    rank: integer().notNull(),
  },
  (table) => [index('model_rankings_date_idx').on(table.date)],
);

export const modelBrandRankingsTableRelation = relations(
  modelRankingsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [modelRankingsTable.userId],
      references: [usersTable.id],
    }),
  }),
);
