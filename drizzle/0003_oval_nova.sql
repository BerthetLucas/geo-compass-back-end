CREATE INDEX "global_rankings_date_idx" ON "global_rankings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "model_rankings_date_idx" ON "model_rankings" USING btree ("date");