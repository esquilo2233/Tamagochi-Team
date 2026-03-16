import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth-api";

// POST - Apostar em uma bet
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const person = await validateSession();
    if (!person) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const betId = parseInt(id, 10);
    const body = await request.json();
    const { optionIdx, coins } = body;

    if (!optionIdx || !coins || coins <= 0) {
      return NextResponse.json(
        { error: "Opção e quantidade de coins são obrigatórias" },
        { status: 400 }
      );
    }

    // Verificar se a bet existe e está ativa
    const bet = await prisma.bets.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      return NextResponse.json({ error: "Bet não encontrada" }, { status: 404 });
    }

    if (bet.status !== "active") {
      return NextResponse.json(
        { error: "Esta bet está fechada para apostas" },
        { status: 400 }
      );
    }

    // Verificar se já votou nesta bet
    const existingVote = await prisma.bet_votes.findUnique({
      where: {
        betId_personId_optionIdx: {
          betId,
          personId: person.id,
          optionIdx,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "Você já apostou nesta opção" },
        { status: 400 }
      );
    }

    // Verificar se tem coins suficientes
    if (person.coins < coins) {
      return NextResponse.json(
        { error: "Coins insuficientes" },
        { status: 400 }
      );
    }

    // Realizar aposta em transação
    const result = await prisma.$transaction(async (tx: any) => {
      // Deduzir coins da pessoa
      await tx.person.update({
        where: { id: person.id },
        data: { coins: { decrement: coins } },
      });

      // Criar o voto
      const vote = await tx.bet_votes.create({
        data: {
          betId,
          personId: person.id,
          optionIdx,
          coins,
        },
      });

      return vote;
    });

    return NextResponse.json({
      success: true,
      vote: result,
      message: "Aposta realizada com sucesso!",
    });
  } catch (error) {
    console.error("[POST /api/bets/vote] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao realizar aposta" },
      { status: 500 }
    );
  }
}

// GET - Detalhes de uma bet específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const betId = parseInt(id, 10);

    const bet = await prisma.bets.findUnique({
      where: { id: betId },
      include: {
        creator: {
          select: { id: true, name: true, code: true },
        },
        bet_votes: {
          include: {
            people: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    if (!bet) {
      return NextResponse.json({ error: "Bet não encontrada" }, { status: 404 });
    }

    // Processar dados da bet
    const options = bet.options as any[] || [];
    const votes = bet.bet_votes || [];

    const optionsWithStats = options.map((opt: any, idx: number) => {
      const optionVotes = votes.filter((v: any) => v.optionIdx === idx);
      const totalCoins = optionVotes.reduce(
        (sum: any, v: any) => sum + v.coins,
        0
      );
      const percentage =
        votes.length > 0 ? (optionVotes.length / votes.length) * 100 : 0;

      return {
        ...opt,
        totalCoins,
        voteCount: optionVotes.length,
        percentage,
      };
    });

    const totalPool = optionsWithStats.reduce(
      (sum: any, opt: any) => sum + opt.totalCoins,
      0
    );

    return NextResponse.json({
      ...bet,
      options: optionsWithStats,
      totalPool,
      totalVotes: votes.length,
    });
  } catch (error) {
    console.error("[GET /api/bets/[id]] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar bet" },
      { status: 500 }
    );
  }
}
