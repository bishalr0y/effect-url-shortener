-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_password_key" ON "users"("password");

-- Insert a placeholder user for existing rows
INSERT INTO "users" ("id", "name", "email", "password") VALUES ('00000000-0000-0000-0000-000000000000', 'Placeholder', 'placeholder@temp.com', 'placeholder');

-- AlterTable - add user_id_fk with default
ALTER TABLE "urls" ADD COLUMN "user_id_fk" TEXT DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;

-- AddForeignKey
ALTER TABLE "urls" ADD CONSTRAINT "urls_user_id_fk_fkey" FOREIGN KEY ("user_id_fk") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove default
ALTER TABLE "urls" ALTER COLUMN "user_id_fk" DROP DEFAULT;
