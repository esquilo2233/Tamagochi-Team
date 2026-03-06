import { NextResponse } from "next/server";
import { getAllRooms } from "../storage";

export async function GET() {
  const rooms = await getAllRooms();

  // Mostrar TODAS as salas activas (sem vencedor), independentemente do número de jogadores
  const openRooms = Array.from(rooms.values())
    .filter((room) => !room.winner) // Apenas salas sem vencedor
    .map((room) => ({
      id: room.id,
      game: room.game,
      players: room.players.length,
      host: room.players[0]?.name,
      hostId: room.players[0]?.id,
      hostPersonId: room.hostPersonId,
      createdAt: room.updatedAt,
    }));

  return NextResponse.json({ ok: true, rooms: openRooms });
}
