ALTER TABLE "llm_responses" ALTER COLUMN "createdAt" SET DATA TYPE timestamp USING to_timestamp("createdAt");--> statement-breakpoint
ALTER TABLE "llm_responses" ALTER COLUMN "createdAt" SET DEFAULT now();
