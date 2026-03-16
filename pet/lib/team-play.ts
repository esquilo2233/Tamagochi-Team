import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Desabilitar verificação de certificado SSL (apenas para Supabase na Vercel)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Supabase integration usa POSTGRES_URL ou POSTGRES_PRISMA_URL
const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;

// PrismaPg com SSL para Supabase
const adapter = new PrismaPg({
    connectionString,
});

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: ["error", "warn", "info"],
    });

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

        // Verificar se a sala é muito antiga (mais de 24 horas)
        const roomAge = Date.now() - room.updatedAt.getTime();
        const MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas
        if (roomAge > MAX_AGE) {
            console.log(`[TeamPlay] Sala ${roomId} muito antiga, a ignorar`);
            return null;
        }

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

        // Filtrar salas antigas e retornar todas as salas activas
        const now = Date.now();
        const MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas

        return rooms
            .filter((room) => {
                // Ignorar salas muito antigas
                const roomAge = now - room.updatedAt.getTime();
                return roomAge < MAX_AGE;
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
