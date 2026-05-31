CREATE TABLE `word_pair_dialect_metadata` (
	`pair_id` integer NOT NULL,
	`target_dialect` text NOT NULL,
	`contrast_strength` text DEFAULT 'supported' NOT NULL,
	`note` text,
	PRIMARY KEY(`pair_id`, `target_dialect`)
);
--> statement-breakpoint
CREATE INDEX `word_pair_dialect_metadata_pair_idx` ON `word_pair_dialect_metadata` (`pair_id`);
--> statement-breakpoint
CREATE INDEX `word_pair_dialect_metadata_dialect_idx` ON `word_pair_dialect_metadata` (`target_dialect`);
