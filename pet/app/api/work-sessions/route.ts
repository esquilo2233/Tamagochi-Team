import { NextResponse } from "next/server";
import { startWorkSession, stopWorkSession } from "../../../lib/pet";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body)
      return NextResponse.json(
        { ok: false, error: "missing body" },
        { status: 400 },
      );
    if (body.action === "start") {
      if (!body.personId)
        return NextResponse.json(
          { ok: false, error: "missing personId" },
          { status: 400 },
        );
      const session = await startWorkSession(body.petId ?? 1, body.personId);
      return NextResponse.json(session);
    }
    if (body.action === "stop") {
      if (!body.sessionId)
        return NextResponse.json(
          { ok: false, error: "missing sessionId" },
          { status: 400 },
        );
      const s = await stopWorkSession(body.sessionId);
      return NextResponse.json(s);
    }
    return NextResponse.json(
      { ok: false, error: "unknown action" },
      { status: 400 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function GET() {
  const sessions = await prisma.workSession.findMany({
    where: { active: true },
    include: {
      person: {
        select: {
          id: true,
          name: true,
          coins: true,
          totalTimeSeconds: true,
        },
      },
    },
  });
  return NextResponse.json(sessions);
}
