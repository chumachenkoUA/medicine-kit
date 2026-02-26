/*
  Warnings:

  - You are about to drop the column `Quantity_week` on the `courses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "courses" DROP COLUMN "Quantity_week",
ADD COLUMN     "Start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP;
