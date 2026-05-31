import { sqliteTable, integer, text, primaryKey, index } from 'drizzle-orm/sqlite-core';

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

export const wordPairDialectMetadata = sqliteTable('word_pair_dialect_metadata', {
  pairId: integer('pair_id').notNull(),
  targetDialect: text('target_dialect').notNull(),
  contrastStrength: text('contrast_strength').notNull().default('supported'),
  note: text('note'),
}, (table) => ({
  pk: primaryKey({ columns: [table.pairId, table.targetDialect] }),
  pairIdx: index('word_pair_dialect_metadata_pair_idx').on(table.pairId),
  dialectIdx: index('word_pair_dialect_metadata_dialect_idx').on(table.targetDialect),
}));

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  provider: text('provider').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const userProgress = sqliteTable('user_progress', {
  userId: text('user_id').notNull(),
  pairId: integer('pair_id').notNull(),
  dialect: text('dialect').notNull(),
  category: text('category').notNull(),
  word1Attempts: integer('word1_attempts').notNull().default(0),
  word1Correct: integer('word1_correct').notNull().default(0),
  word2Attempts: integer('word2_attempts').notNull().default(0),
  word2Correct: integer('word2_correct').notNull().default(0),
  pairCompletions: integer('pair_completions').notNull().default(0),
  exposureCount: integer('exposure_count').notNull().default(0),
  recentIncorrectCount: integer('recent_incorrect_count').notNull().default(0),
  successStreak: integer('success_streak').notNull().default(0),
  lastSeenAt: text('last_seen_at'),
  lastCorrectAt: text('last_correct_at'),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.pairId, table.dialect] }),
  userIdx: index('user_progress_user_idx').on(table.userId),
}));
