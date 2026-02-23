type GameType = "tictactoe" | "chess" | "connect4";

export type Room = {
    id: string;
    game: GameType;
    players: Array<{ id: string; name: string; color: "X" | "O" | "w" | "b" }>;
    turn: "X" | "O" | "w" | "b";
    winner: "X" | "O" | "w" | "b" | "draw" | null;
    state: any;
    rematchVotes: string[];
    updatedAt: number;
};

// Armazenamento global partilhado
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

export function addClient(roomId: string, controller: ReadableStreamDefaultController) {
    if (!clients.has(roomId)) {
        clients.set(roomId, new Set());
    }
    clients.get(roomId)!.add(controller);
}

export function removeClient(roomId: string, controller: ReadableStreamDefaultController) {
    const roomClients = clients.get(roomId);
    if (roomClients) {
        roomClients.delete(controller);
        if (roomClients.size === 0) {
            clients.delete(roomId);
        }
    }
}

export function hasRoom(roomId: string): boolean {
    return rooms.has(roomId);
}

export function getAllRooms(): Map<string, Room> {
    return rooms;
}
