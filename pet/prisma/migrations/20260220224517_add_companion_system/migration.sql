/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `people` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `people` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "people" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "companion_sessions" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "coinsEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "companion_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "people_code_key" ON "people"("code");

-- AddForeignKey
ALTER TABLE "companion_sessions" ADD CONSTRAINT "companion_sessions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
