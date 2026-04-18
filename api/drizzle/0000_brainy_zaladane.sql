CREATE TABLE `word_pairs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word1` text NOT NULL,
	`word2` text NOT NULL,
	`phoneme_type` text NOT NULL,
	`target_sounds` text,
	`dialect_filter` text DEFAULT 'all' NOT NULL,
	`difficulty_level` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
