CREATE TABLE "llm_responses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "llm_responses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"model" varchar(255) NOT NULL,
	"response" text NOT NULL,
	"createdAt" integer NOT NULL
);
