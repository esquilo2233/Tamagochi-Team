import {
  getRoom as getRoomDB,
  upsertRoom,
  getOpenRooms as getOpenRoomsDB,
  deleteRoom as deleteRoomDB,
} from "../../../lib/team-play";

export type Room = {
  id: string;
  game: "tictactoe" | "chess" | "connect4";
  players: Array<{ id: string; name: string; color: "X" | "O" | "w" | "b" }>;
  turn: "X" | "O" | "w" | "b";
  winner: "X" | "O" | "w" | "b" | "draw" | null;
  state: any;
  rematchVotes: string[];
  updatedAt: number;
  hostPersonId?: number;
};

// Cache em memória para reduzir chamadas à DB
const roomCache = new Map<string, { room: Room; timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos (aumentado para evitar bugs em salas antigas)
const ROOM_MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas - salas mais antigas que isto são ignoradas

const clients = new Map<string, Set<ReadableStreamDefaultController>>();

function getCachedRoom(roomId: string): Room | null {
  const cached = roomCache.get(roomId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.room;
  }
  return null;
}

function setCachedRoom(roomId: string, room: Room) {
  roomCache.set(roomId, { room, timestamp: Date.now() });
}

export async function getRoom(roomId: string): Promise<Room | undefined> {
  // Tenta cache primeiro
  const cached = getCachedRoom(roomId);
  if (cached) {
    return cached;
  }

  // Busca na DB
  const dbRoom = await getRoomDB(roomId);
  if (!dbRoom) {
    roomCache.delete(roomId);
    return undefined;
  }

  // Verificar se a sala é muito antiga (mais de 24 horas)
  const roomAge = Date.now() - dbRoom.updatedAt.getTime();
  if (roomAge > ROOM_MAX_AGE) {
    console.log(
      `[TeamPlay] Sala ${roomId} muito antiga (${Math.floor(roomAge / (60 * 60 * 1000))}h), a ignorar`,
    );
    roomCache.delete(roomId);
    return undefined;
  }

  const room: Room = {
    id: dbRoom.id,
    game: dbRoom.game as any,
    players: dbRoom.players,
    turn: dbRoom.turn as any,
    winner: dbRoom.winner as any,
    state: dbRoom.state,
    rematchVotes: dbRoom.rematchVotes,
    updatedAt: dbRoom.updatedAt.getTime(),
  };

  setCachedRoom(roomId, room);
  return room;
}

export async function setRoom(roomId: string, room: Room) {
  try {
    await upsertRoom(room);
    setCachedRoom(roomId, room);

    // Notificar TODOS os clientes IMEDIATAMENTE
    notifyClients(roomId, room);

    // Re-notificar após 100ms para garantir sincronização
    setTimeout(() => {
      notifyClients(roomId, room);
    }, 100);
  } catch (error) {
    console.error("Erro ao guardar sala na DB:", error);
  }
}

export async function deleteRoom(roomId: string) {
  try {
    await deleteRoomDB(roomId);
    roomCache.delete(roomId);
    notifyClients(roomId, null);
  } catch (error) {
    console.error("Erro ao eliminar sala da DB:", error);
  }
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

export function addClient(
  roomId: string,
  controller: ReadableStreamDefaultController,
) {
  if (!clients.has(roomId)) {
    clients.set(roomId, new Set());
  }
  clients.get(roomId)!.add(controller);
}

export function removeClient(
  roomId: string,
  controller: ReadableStreamDefaultController,
) {
  const roomClients = clients.get(roomId);
  if (roomClients) {
    roomClients.delete(controller);
    if (roomClients.size === 0) {
      clients.delete(roomId);
    }
  }
}

export async function hasRoom(roomId: string): Promise<boolean> {
  const cached = getCachedRoom(roomId);
  if (cached) return true;

  const dbRoom = await getRoomDB(roomId);
  return !!dbRoom;
}

export async function getAllRooms(): Promise<Map<string, Room>> {
  const dbRooms = await getOpenRoomsDB();
  const rooms = new Map<string, Room>();

  dbRooms.forEach((dbRoom) => {
    const room: Room = {
      id: dbRoom.id,
      game: dbRoom.game as any,
      players: dbRoom.players,
      turn: dbRoom.turn as any,
      winner: dbRoom.winner as any,
      state: dbRoom.state,
      rematchVotes: dbRoom.rematchVotes,
      updatedAt: dbRoom.updatedAt.getTime(),
    };
    rooms.set(dbRoom.id, room);
    setCachedRoom(dbRoom.id, room);
  });

  return rooms;
}
