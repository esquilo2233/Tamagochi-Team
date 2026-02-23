import { NextRequest } from "next/server";

type GameType = "tictactoe" | "chess" | "connect4";

type Room = {
    id: string;
    game: GameType;
    players: Array<{ id: string; name: string; color: "X" | "O" | "w" | "b" }>;
    turn: "X" | "O" | "w" | "b";
    winner: "X" | "O" | "w" | "b" | "draw" | null;
    state: any;
    rematchVotes: string[];
    updatedAt: number;
};

const rooms = new Map<string, Room>();
const clients = new Map<string, Set<ReadableStreamDefaultController>>();

export function getRoom(roomId: string): Room | undefined {
    return rooms.get(roomId);
}

export function setRoom(roomId: string, room: Room) {
    rooms.set(roomId, room);
    notifyClients(roomId, room);
}

export function deleteRoom(roomId: string) {
    rooms.delete(roomId);
    notifyClients(roomId, null);
}

export function notifyClients(roomId: string, room: Room | null) {
    const roomClients = clients.get(roomId);
    if (!roomClients) return;

    const data = room
        ? JSON.stringify({ ok: true, room })
        : JSON.stringify({ ok: false, error: "Sala terminada" });

    roomClients.forEach((controller) => {
        try {
            controller.enqueue(`data: ${data}\n\n`);
        } catch {
            // Cliente desconectado, será removido no cleanup
        }
    });
}

export async function GET(req: NextRequest) {
    const roomId = req.nextUrl.searchParams.get("roomId");
    if (!roomId) {
        return new Response(
            JSON.stringify({ ok: false, error: "roomId necessário" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // Adiciona este cliente à lista de listeners da sala
            if (!clients.has(roomId)) {
                clients.set(roomId, new Set());
            }
            clients.get(roomId)!.add(controller);

            // Envia estado atual imediatamente
            const room = rooms.get(roomId);
            if (room) {
                controller.enqueue(
                    `data: ${JSON.stringify({ ok: true, room })}\n\n`,
                );
            }

            // Cleanup quando o cliente desconectar
            req.signal.addEventListener("abort", () => {
                const roomClients = clients.get(roomId);
                if (roomClients) {
                    roomClients.delete(controller);
                    if (roomClients.size === 0) {
                        clients.delete(roomId);
                    }
                }
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
