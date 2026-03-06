import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.action) {
      return NextResponse.json(
        { ok: false, error: "missing action" },
        { status: 400 },
      );
    }

    if (body.action === "start") {
      if (!body.personId) {
        return NextResponse.json(
          { ok: false, error: "missing personId" },
          { status: 400 },
        );
      }
      if (!body.petId) {
        return NextResponse.json(
          { ok: false, error: "missing petId" },
          { status: 400 },
        );
      }

      // Verificar se já existe sessão ativa para esta pessoa
      const existing = await prisma.samuraiSession.findFirst({
        where: { personId: body.personId, active: true },
      });

      if (existing) {
        return NextResponse.json({ ok: true, session: existing, isNew: false });
      }

      const session = await prisma.samuraiSession.create({
        data: {
          personId: body.personId,
          petId: body.petId,
          startedAt: new Date(),
          lastClickAt: new Date(),
          active: true,
          totalSeconds: 0,
        },
      });

      return NextResponse.json({ ok: true, session, isNew: true });
    }

    if (body.action === "stop") {
      if (!body.sessionId) {
        return NextResponse.json(
          { ok: false, error: "missing sessionId" },
          { status: 400 },
        );
      }

      const session = await prisma.samuraiSession.findUnique({
        where: { id: body.sessionId },
        include: { person: true },
      });

      if (!session) {
        return NextResponse.json(
          { ok: false, error: "session not found" },
          { status: 404 },
        );
      }

      // Calcular tempo total baseado no startedAt até agora
      const now = new Date();
      const started = session.startedAt;
      const totalSessionSeconds = Math.floor(
        (now.getTime() - started.getTime()) / 1000,
      );

      // Atualizar tempo total da pessoa
      if (totalSessionSeconds > 0) {
        await prisma.person.update({
          where: { id: session.personId },
          data: {
            totalTimeSeconds: {
              increment: totalSessionSeconds,
            },
          },
        });
      }

      const updatedSession = await prisma.samuraiSession.update({
        where: { id: body.sessionId },
        data: {
          active: false,
          totalSeconds: totalSessionSeconds,
        },
      });

      return NextResponse.json({ ok: true, session: updatedSession });
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const personId = url.searchParams.get("personId");

    if (personId) {
      const sessions = await prisma.samuraiSession.findMany({
        where: { personId: Number(personId), active: true },
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
        orderBy: { startedAt: "desc" },
      });
      return NextResponse.json(sessions);
    }

    // Retornar todas as sessões ativas
    const sessions = await prisma.samuraiSession.findMany({
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
      orderBy: { startedAt: "desc" },
    });
    return NextResponse.json(sessions);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}
