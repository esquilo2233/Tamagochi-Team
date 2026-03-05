-- CreateTable
CREATE TABLE "bug_report_files" (
    "id" SERIAL NOT NULL,
    "bugReportId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bug_report_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bug_report_files" ADD CONSTRAINT "bug_report_files_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "bug_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "bug_report_files_bugReportId_idx" ON "bug_report_files"("bugReportId");
