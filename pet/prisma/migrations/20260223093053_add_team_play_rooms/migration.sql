-- CreateTable
CREATE TABLE "team_play_rooms" (
    "id" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "players" JSONB NOT NULL,
    "turn" TEXT NOT NULL,
    "winner" TEXT,
    "state" JSONB NOT NULL,
    "rematchVotes" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_play_rooms_pkey" PRIMARY KEY ("id")
);
