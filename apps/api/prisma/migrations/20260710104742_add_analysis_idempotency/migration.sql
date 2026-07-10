/*
  Warnings:

  - Added the required column `textHash` to the `Analysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "textHash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Analysis_userId_textHash_createdAt_idx" ON "Analysis"("userId", "textHash", "createdAt");
