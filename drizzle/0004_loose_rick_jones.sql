CREATE TABLE "prompts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "prompts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"text" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
