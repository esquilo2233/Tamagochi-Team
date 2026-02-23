import { NextResponse } from "next/server";
import { getAllRooms } from "../storage";

export async function GET() {
    const rooms = getAllRooms();

    const openRooms = Array.from(rooms.values())
        .filter((room) => room.players.length < 2 && !room.winner)
        .map((room) => ({
            id: room.id,
            game: room.game,
            players: room.players.length,
            host: room.players[0]?.name,
            createdAt: room.updatedAt,
        }));

    return NextResponse.json({ ok: true, rooms: openRooms });
}
