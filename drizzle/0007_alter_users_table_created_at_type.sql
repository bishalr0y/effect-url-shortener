ALTER TABLE "urls" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "urls" ALTER COLUMN "created_at" SET DEFAULT now();