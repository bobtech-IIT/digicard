CREATE TABLE `aiProviders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('groq','openrouter','cerebras') NOT NULL,
	`apiKey` text NOT NULL,
	`endpoint` varchar(512),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiProviders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batchJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobId` varchar(64) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`totalCandidates` int NOT NULL,
	`processedCount` int NOT NULL DEFAULT 0,
	`cardIds` text,
	`downloadUrl` varchar(512),
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `batchJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `batchJobs_jobId_unique` UNIQUE(`jobId`)
);
--> statement-breakpoint
CREATE TABLE `digitalCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`designation` varchar(255),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`officeName` varchar(255),
	`officeDetails` text,
	`headshotUrl` varchar(512),
	`socialLinks` text,
	`aspectRatio` enum('3:4','16:9') NOT NULL DEFAULT '3:4',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `digitalCards_id` PRIMARY KEY(`id`)
);
