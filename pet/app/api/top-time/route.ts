import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = url.searchParams.get("limit");
    const n = limit ? parseInt(limit, 10) : 10;

    // Buscar pessoas ordenadas por tempo total
    const people = await prisma.person.findMany({
      orderBy: { totalTimeSeconds: "desc" },
      take: Number.isFinite(n) && n > 0 ? n : 10,
    });

    return NextResponse.json(people);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
