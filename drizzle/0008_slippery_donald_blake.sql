ALTER TABLE "users" ADD COLUMN "emailNotifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "openRouterApiKey" varchar(255);