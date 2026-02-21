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

      // Criar também uma sessão de tracking de tempo para o companion
      if (person && body.petId) {
        const samuraiSession = await prisma.samuraiSession.create({
          data: {
            personId: person.id,
            petId: body.petId,
            startedAt: new Date(),
            lastClickAt: new Date(),
            active: true,
            totalSeconds: 0,
          },
        });
        return NextResponse.json({ ok: true, session, person, samuraiSessionId: samuraiSession.id });
      }

      return NextResponse.json({ ok: true, session, person });
    }

    if (body.action === "stop") {
      if (!body.sessionId) {
        return NextResponse.json({ ok: false, error: "missing sessionId" }, { status: 400 });
      }
      const session = await stopCompanionSession(body.sessionId);

      // Parar também a sessão de tracking associada
      if (session && session.personId) {
        await prisma.samuraiSession.updateMany({
          where: { personId: session.personId, active: true },
          data: { active: false },
        });
      }

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
