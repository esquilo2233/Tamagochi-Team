import { NextResponse } from "next/server";
import { getAllRooms } from "../storage";

export async function GET() {
    const rooms = await getAllRooms();

    const openRooms = Array.from(rooms.values())
        .filter((room) => room.players.length < 2 && !room.winner)
        .map((room) => ({
            id: room.id,
            game: room.game,
            players: room.players.length,
            host: room.players[0]?.name,
            hostId: room.players[0]?.id,
            createdAt: room.updatedAt,
        }));

    return NextResponse.json({ ok: true, rooms: openRooms });
}
