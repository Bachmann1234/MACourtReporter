CREATE TABLE `bill` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`court_number` integer NOT NULL,
	`bill_number` text NOT NULL,
	`filed_by` text NOT NULL,
	`summary` text NOT NULL,
	`url` text NOT NULL,
	`status` text DEFAULT 'NEW' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `court_bill_number_idx` ON `bill` (`court_number`,`bill_number`);--> statement-breakpoint
CREATE TABLE `post` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`bill_id` integer NOT NULL,
	`uri` text,
	`text` text NOT NULL,
	FOREIGN KEY (`bill_id`) REFERENCES `bill`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_bill_id_unique` ON `post` (`bill_id`);