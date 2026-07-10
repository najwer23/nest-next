-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('COMPLETED');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "isEmpty" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_requestedBy_idx" ON "Report"("requestedBy");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
