import { NextResponse } from "next/server";
import { startCompanionSession, stopCompanionSession, getPersonByCode } from "../../../lib/pet";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.action) {
      return NextResponse.json({ ok: false, error: "missing action" }, { status: 400 });
    }

    if (body.action === "start") {
      if (!body.code) {
        return NextResponse.json({ ok: false, error: "missing code" }, { status: 400 });
      }
      const session = await startCompanionSession(body.code);
      const person = await getPersonByCode(body.code);
      return NextResponse.json({ ok: true, session, person });
    }

    if (body.action === "stop") {
      if (!body.sessionId) {
        return NextResponse.json({ ok: false, error: "missing sessionId" }, { status: 400 });
      }
      const session = await stopCompanionSession(body.sessionId);
      return NextResponse.json({ ok: true, session });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (code) {
      const sessions = await prisma.companionSession.findMany({
        where: { code, active: true },
        include: { person: true },
        orderBy: { startedAt: "desc" },
      });
      return NextResponse.json(sessions);
    }
    const sessions = await prisma.companionSession.findMany({
      where: { active: true },
      include: { person: true },
      orderBy: { startedAt: "desc" },
    });
    return NextResponse.json(sessions);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
