/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `urls` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "urls_code_url_key";

-- CreateIndex
CREATE UNIQUE INDEX "urls_code_key" ON "urls"("code");
