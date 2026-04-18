import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const wordPairs = sqliteTable('word_pairs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  word1: text('word1').notNull(),
  word2: text('word2').notNull(),
  phonemeType: text('phoneme_type').notNull(),
  targetSounds: text('target_sounds'),
  dialectFilter: text('dialect_filter').notNull().default('all'),
  difficultyLevel: integer('difficulty_level').notNull().default(1),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});
