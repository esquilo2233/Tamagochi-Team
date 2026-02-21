-- AlterTable
ALTER TABLE "people" ADD COLUMN     "totalTimeSeconds" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "samurai_sessions" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "petId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastClickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "samurai_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "samurai_sessions" ADD CONSTRAINT "samurai_sessions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
