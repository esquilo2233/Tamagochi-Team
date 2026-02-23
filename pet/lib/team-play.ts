import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Configuração compatível com Prisma v7 + Accelerate
const clientOptions: any = { log: ["error"] };
if (process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.startsWith("prisma+")) {
        clientOptions.accelerateUrl = process.env.DATABASE_URL;
    } else {
        clientOptions.datasourceUrl = process.env.DATABASE_URL;
    }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(clientOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type RoomDB = {
    id: string;
    game: string;
    players: any[];
    turn: string;
    winner: string | null;
    state: any;
    rematchVotes: string[];
    hostPersonId: number | null;
    createdAt: Date;
    updatedAt: Date;
};

export async function getRoom(roomId: string): Promise<RoomDB | null> {
    try {
        const room = await prisma.teamPlayRoom.findUnique({
            where: { id: roomId },
        });
        if (!room) return null;
        return {
            ...room,
            players: room.players as any[],
            state: room.state as any,
            rematchVotes: room.rematchVotes as string[],
        };
    } catch (error) {
        console.error("Erro ao obter sala:", error);
        return null;
    }
}

export async function createRoom(room: {
    id: string;
    game: string;
    players: any[];
    turn: string;
    winner: string | null;
    state: any;
    rematchVotes: string[];
    hostPersonId?: number;
}): Promise<RoomDB> {
    try {
        const created = await prisma.teamPlayRoom.create({
            data: {
                id: room.id,
                game: room.game,
                players: room.players as any,
                turn: room.turn,
                winner: room.winner,
                state: room.state as any,
                rematchVotes: room.rematchVotes as any,
                hostPersonId: room.hostPersonId,
            },
        });
        return {
            ...created,
            players: created.players as any[],
            state: created.state as any,
            rematchVotes: created.rematchVotes as string[],
        };
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        throw error;
    }
}

export async function updateRoom(
    roomId: string,
    data: Partial<{
        players: any[];
        turn: string;
        winner: string | null;
        state: any;
        rematchVotes: string[];
    }>,
): Promise<RoomDB | null> {
    try {
        const updated = await prisma.teamPlayRoom.update({
            where: { id: roomId },
            data: {
                players: data.players as any,
                turn: data.turn,
                winner: data.winner,
                state: data.state as any,
                rematchVotes: data.rematchVotes as any,
            },
        });
        return {
            ...updated,
            players: updated.players as any[],
            state: updated.state as any,
            rematchVotes: updated.rematchVotes as string[],
        };
    } catch (error) {
        console.error("Erro ao atualizar sala:", error);
        return null;
    }
}

export async function deleteRoom(roomId: string): Promise<void> {
    try {
        await prisma.teamPlayRoom.delete({
            where: { id: roomId },
        });
    } catch (error) {
        console.error("Erro ao eliminar sala:", error);
    }
}

export async function getOpenRooms(): Promise<RoomDB[]> {
    try {
        const rooms = await prisma.teamPlayRoom.findMany({
            where: {
                winner: null,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        // Filtrar salas com menos de 2 jogadores
        return rooms
            .filter((room) => {
                const players = room.players as any[];
                return players.length < 2;
            })
            .map((room) => ({
                ...room,
                players: room.players as any[],
                state: room.state as any,
                rematchVotes: room.rematchVotes as string[],
            }));
    } catch (error) {
        console.error("Erro ao obter salas abertas:", error);
        return [];
    }
}

export async function upsertRoom(room: {
    id: string;
    game: string;
    players: any[];
    turn: string;
    winner: string | null;
    state: any;
    rematchVotes: string[];
    hostPersonId?: number;
}): Promise<RoomDB> {
    try {
        const upserted = await prisma.teamPlayRoom.upsert({
            where: { id: room.id },
            create: {
                id: room.id,
                game: room.game,
                players: room.players as any,
                turn: room.turn,
                winner: room.winner,
                state: room.state as any,
                rematchVotes: room.rematchVotes as any,
                hostPersonId: room.hostPersonId,
            },
            update: {
                players: room.players as any,
                turn: room.turn,
                winner: room.winner,
                state: room.state as any,
                rematchVotes: room.rematchVotes as any,
                hostPersonId: room.hostPersonId,
            },
        });
        return {
            ...upserted,
            players: upserted.players as any[],
            state: upserted.state as any,
            rematchVotes: upserted.rematchVotes as string[],
        };
    } catch (error) {
        console.error("Erro ao fazer upsert da sala:", error);
        throw error;
    }
}
