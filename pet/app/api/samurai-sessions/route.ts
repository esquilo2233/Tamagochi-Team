import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const CLICK_INTERVAL_MS = 30000; // 30 segundos - tempo máximo entre cliques para manter sessão ativa
const TIME_REWARD_MS = 1000; // 1 segundo de tempo por clique válido

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.action) {
      return NextResponse.json({ ok: false, error: "missing action" }, { status: 400 });
    }

    if (body.action === "start") {
      if (!body.personId) {
        return NextResponse.json({ ok: false, error: "missing personId" }, { status: 400 });
      }
      if (!body.petId) {
        return NextResponse.json({ ok: false, error: "missing petId" }, { status: 400 });
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

    if (body.action === "click") {
      if (!body.sessionId) {
        return NextResponse.json({ ok: false, error: "missing sessionId" }, { status: 400 });
      }

      const session = await prisma.samuraiSession.findUnique({
        where: { id: body.sessionId },
        include: { person: true },
      });

      if (!session || !session.active) {
        return NextResponse.json({ ok: false, error: "session not found or inactive" }, { status: 404 });
      }

      const now = new Date();
      const lastClick = session.lastClickAt;
      const elapsed = now.getTime() - lastClick.getTime();

      // Verificar se passou do tempo máximo entre cliques (anti-cheating)
      if (elapsed > CLICK_INTERVAL_MS) {
        // Sessão expirou - desativar e exigir novo clique inicial
        await prisma.samuraiSession.update({
          where: { id: body.sessionId },
          data: { active: false },
        });
        return NextResponse.json({
          ok: false,
          error: "session_expired",
          message: "Tempo esgotado! Clique no samurai para reiniciar."
        }, { status: 400 });
      }

      // Calcular tempo ganho desde o último clique (máximo de 1 segundo por clique)
      const timeEarned = Math.min(elapsed, TIME_REWARD_MS);
      const secondsEarned = timeEarned / 1000;

      // Atualizar sessão
      const updatedSession = await prisma.samuraiSession.update({
        where: { id: body.sessionId },
        data: {
          lastClickAt: now,
          totalSeconds: session.totalSeconds + secondsEarned,
        },
      });

      // Atualizar tempo total da pessoa
      await prisma.person.update({
        where: { id: session.personId },
        data: {
          totalTimeSeconds: {
            increment: Math.floor(secondsEarned),
          },
        },
      });

      return NextResponse.json({
        ok: true,
        session: updatedSession,
        secondsEarned,
        totalSeconds: updatedSession.totalSeconds + secondsEarned,
      });
    }

    if (body.action === "stop") {
      if (!body.sessionId) {
        return NextResponse.json({ ok: false, error: "missing sessionId" }, { status: 400 });
      }

      const session = await prisma.samuraiSession.findUnique({
        where: { id: body.sessionId },
        include: { person: true },
      });

      if (!session) {
        return NextResponse.json({ ok: false, error: "session not found" }, { status: 404 });
      }

      // Calcular tempo total baseado no startedAt até agora
      // (para sessões de companion que não usam o sistema de cliques)
      const now = new Date();
      const started = session.startedAt;
      const totalSessionSeconds = Math.floor((now.getTime() - started.getTime()) / 1000);

      // Somar o tempo já registrado com o tempo adicional
      const finalSeconds = Math.max(session.totalSeconds || 0, totalSessionSeconds);

      // Atualizar tempo total da pessoa
      if (finalSeconds > 0) {
        await prisma.person.update({
          where: { id: session.personId },
          data: {
            totalTimeSeconds: {
              increment: finalSeconds,
            },
          },
        });
      }

      const updatedSession = await prisma.samuraiSession.update({
        where: { id: body.sessionId },
        data: {
          active: false,
          totalSeconds: finalSeconds,
        },
      });

      return NextResponse.json({ ok: true, session: updatedSession });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const personId = url.searchParams.get("personId");

    if (personId) {
      const sessions = await prisma.samuraiSession.findMany({
        where: { personId: Number(personId), active: true },
        include: { person: true },
        orderBy: { startedAt: "desc" },
      });
      return NextResponse.json(sessions);
    }

    // Retornar todas as sessões ativas
    const sessions = await prisma.samuraiSession.findMany({
      where: { active: true },
      include: { person: true },
      orderBy: { startedAt: "desc" },
    });
    return NextResponse.json(sessions);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
