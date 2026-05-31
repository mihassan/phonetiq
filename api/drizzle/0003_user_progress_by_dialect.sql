CREATE TABLE `__new_user_progress` (
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
	PRIMARY KEY(`user_id`, `pair_id`, `dialect`)
);
--> statement-breakpoint
INSERT INTO `__new_user_progress` (
	`user_id`,
	`pair_id`,
	`dialect`,
	`category`,
	`word1_attempts`,
	`word1_correct`,
	`word2_attempts`,
	`word2_correct`,
	`pair_completions`,
	`exposure_count`,
	`recent_incorrect_count`,
	`success_streak`,
	`last_seen_at`,
	`last_correct_at`
)
SELECT
	`user_id`,
	`pair_id`,
	CASE
		WHEN `dialect` IN ('us_only', 'uk_only', 'au_only') THEN `dialect`
		ELSE 'us_only'
	END,
	`category`,
	`word1_attempts`,
	`word1_correct`,
	`word2_attempts`,
	`word2_correct`,
	`pair_completions`,
	`exposure_count`,
	`recent_incorrect_count`,
	`success_streak`,
	`last_seen_at`,
	`last_correct_at`
FROM `user_progress`;
--> statement-breakpoint
DROP TABLE `user_progress`;
--> statement-breakpoint
ALTER TABLE `__new_user_progress` RENAME TO `user_progress`;
--> statement-breakpoint
CREATE INDEX `user_progress_user_idx` ON `user_progress` (`user_id`);
