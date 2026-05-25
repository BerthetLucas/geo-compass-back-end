CREATE TABLE "global_rankings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "global_rankings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" date NOT NULL,
	"brand" varchar(255) NOT NULL,
	"mentions" integer NOT NULL,
	"rank" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_rankings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "model_rankings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" date NOT NULL,
	"model" varchar(255) NOT NULL,
	"brand" varchar(255) NOT NULL,
	"mentions" integer NOT NULL,
	"rank" integer NOT NULL
);
