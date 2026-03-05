import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import {
  awardCoinsToPerson,
  applyItemEffect,
  getRewardsConfig,
} from "../../../lib/pet";

// Limites máximos de score por jogo (anti-cheat)
const MAX_SCORES: Record<string, number> = {
  clickrush: 100,
  tictactoe: 1,
  chess: 1,
  connect4: 1,
};

// Validar score
function isValidScore(game: string, score: number, outcome?: string): boolean {
  const maxScore = MAX_SCORES[game];

  if (maxScore !== undefined && score > maxScore) {
    return false;
  }

  // Para jogos de outcome, validar
  if (["tictactoe", "chess", "connect4"].includes(game)) {
    if (!["win", "lose", "draw"].includes(outcome?.toLowerCase() || "")) {
      return false;
    }
  }

  // Score não pode ser negativo
  if (score < 0) {
    return false;
  }

  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validar campos obrigatórios
    if (!body || !body.game || typeof body.score !== "number") {
      return NextResponse.json(
        { ok: false, error: "Dados inválidos" },
        { status: 400 },
      );
    }

    const personId = typeof body.personId === "number" ? body.personId : null;
    if (!personId || personId <= 0) {
      return NextResponse.json(
        { ok: false, error: "personId inválido" },
        { status: 400 },
      );
    }

    // Verificar se pessoa existe
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: { id: true, role: true },
    });

    if (!person) {
      return NextResponse.json(
        { ok: false, error: "Pessoa não encontrada" },
        { status: 404 },
      );
    }

    const rewards = await getRewardsConfig();
    const game = String(body.game).toLowerCase().trim();
    const outcome = String(body.outcome ?? "")
      .toLowerCase()
      .trim();
    const rawScore = Number(body.score ?? 0);

    // Validar jogo permitido
    const allowedGames = ["clickrush", "tictactoe", "chess", "connect4"];
    if (!allowedGames.includes(game)) {
      return NextResponse.json(
        { ok: false, error: "Jogo não reconhecido" },
        { status: 400 },
      );
    }

    // Validar score (anti-cheat)
    if (!isValidScore(game, rawScore, outcome)) {
      console.warn(
        `Score inválido detectado: ${game} - score: ${rawScore} - personId: ${personId}`,
      );
      return NextResponse.json(
        { ok: false, error: "Score inválido" },
        { status: 400 },
      );
    }

    let total = 0;
    if (game === "clickrush") {
      const isWin = rawScore >= rewards.clickrushWinScoreThreshold;
      total = isWin ? rewards.clickrushWinCoins : rewards.clickrushLoseCoins;
    } else if (game === "tictactoe") {
      if (outcome === "win") total = rewards.tictactoeWinCoins;
      else if (outcome === "lose") total = rewards.tictactoeLoseCoins;
      else total = 0;
    } else if (game === "chess") {
      if (outcome === "win") total = rewards.chessWinCoins;
      else if (outcome === "lose") total = rewards.chessLoseCoins;
      else total = 0;
    } else if (game === "connect4") {
      if (outcome === "win") total = rewards.connect4WinCoins;
      else if (outcome === "lose") total = rewards.connect4LoseCoins;
      else total = 0;
    }

    // Limitar ganho máximo por sessão de jogo
    const maxCoinsPerGame = Math.max(
      rewards.clickrushWinCoins,
      rewards.tictactoeWinCoins,
      rewards.chessWinCoins,
      rewards.connect4WinCoins,
    );

    if (total > maxCoinsPerGame) {
      total = maxCoinsPerGame;
    }

    const updatedPerson = await awardCoinsToPerson(personId, total, {
      game: body.game,
      playerName: body.player,
      score: body.score,
    });

    // Ao jogar: fome, energia e higiene descem
    const petId = typeof body.petId === "number" ? body.petId : 1;
    await applyItemEffect(petId, { hunger: -5, energy: -8, hygiene: -3 });

    return NextResponse.json({
      ok: true,
      coinsAwarded: total,
      person: updatedPerson,
    });
  } catch (err: any) {
    console.error("Erro no jogo:", err);
    return NextResponse.json(
      { ok: false, error: "Erro ao processar jogo" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    games: [
      {
        id: "clickrush",
        name: "Click Rush",
        desc: "Clique rápido para ganhar moedas",
      },
    ],
  });
}
