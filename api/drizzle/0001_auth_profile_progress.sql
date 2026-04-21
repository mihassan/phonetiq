CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE INDEX `users_provider_lookup_idx` ON `users` (`provider`, `provider_user_id`);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);
--> statement-breakpoint
CREATE TABLE `user_progress` (
	`user_id` text NOT NULL,
	`pair_id` integer NOT NULL,
	`dialect` text NOT NULL,
	`category` text NOT NULL,
	`word1_attempts` integer DEFAULT 0 NOT NULL,
	`word1_correct` integer DEFAULT 0 NOT NULL,
	`word2_attempts` integer DEFAULT 0 NOT NULL,
	`word2_correct` integer DEFAULT 0 NOT NULL,
	`pair_completions` integer DEFAULT 0 NOT NULL,
	`exposure_count` integer DEFAULT 0 NOT NULL,
	`recent_incorrect_count` integer DEFAULT 0 NOT NULL,
	`success_streak` integer DEFAULT 0 NOT NULL,
	`last_seen_at` text,
	`last_correct_at` text,
	PRIMARY KEY(`user_id`, `pair_id`)
);
--> statement-breakpoint
CREATE INDEX `user_progress_user_idx` ON `user_progress` (`user_id`);
