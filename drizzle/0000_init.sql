CREATE TABLE "urls" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "urls_code_unique" UNIQUE("code")
);
