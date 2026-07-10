/*
  Warnings:

  - The `keywords` column on the `Analysis` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('SUCCESS', 'FAILED');

-- DropIndex
DROP INDEX "Analysis_userId_textHash_createdAt_idx";

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "status" "AnalysisStatus" NOT NULL DEFAULT 'SUCCESS',
ALTER COLUMN "sentiment" DROP NOT NULL,
DROP COLUMN "keywords",
ADD COLUMN     "keywords" JSONB;

-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

-- CreateIndex
CREATE INDEX "Analysis_textHash_idx" ON "Analysis"("textHash");
