import {
  date,
  index,
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
