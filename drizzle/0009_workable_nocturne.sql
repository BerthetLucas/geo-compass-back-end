ALTER TABLE "llm_responses" DROP CONSTRAINT "llm_responses_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "global_rankings" DROP CONSTRAINT "global_rankings_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "model_rankings" DROP CONSTRAINT "model_rankings_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "llm_responses" ADD CONSTRAINT "llm_responses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_rankings" ADD CONSTRAINT "global_rankings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_rankings" ADD CONSTRAINT "model_rankings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;