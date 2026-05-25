import { date, index, integer, pgTable, varchar } from 'drizzle-orm/pg-core';

export const globalRankingsTable = pgTable(
  'global_rankings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    date: date().notNull(),
    brand: varchar({ length: 255 }).notNull(),
    mentions: integer().notNull(),
    rank: integer().notNull(),
  },
  (table) => [index('global_rankings_date_idx').on(table.date)],
);

export const modelRankingsTable = pgTable(
  'model_rankings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    date: date().notNull(),
    model: varchar({ length: 255 }).notNull(),
    brand: varchar({ length: 255 }).notNull(),
    mentions: integer().notNull(),
    rank: integer().notNull(),
  },
  (table) => [index('model_rankings_date_idx').on(table.date)],
);
