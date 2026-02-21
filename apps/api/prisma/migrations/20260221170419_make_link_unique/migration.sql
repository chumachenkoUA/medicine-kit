/*
  Warnings:

  - A unique constraint covering the columns `[Link]` on the table `tabletos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tabletos_Link_key" ON "tabletos"("Link");
