ALTER TABLE "llm_responses" ADD COLUMN "userId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "global_rankings" ADD COLUMN "userId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "model_rankings" ADD COLUMN "userId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_responses" ADD CONSTRAINT "llm_responses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_rankings" ADD CONSTRAINT "global_rankings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_rankings" ADD CONSTRAINT "model_rankings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;