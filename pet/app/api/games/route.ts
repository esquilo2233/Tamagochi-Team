import { NextResponse } from "next/server";
import { awardCoinsToPerson, applyItemEffect, getRewardsConfig } from "../../../lib/pet";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // expected: { game: string, personId?: number, player?: string, score: number, outcome?: 'win'|'lose'|'draw' }
    if (!body || !body.game || typeof body.score !== 'number') {
      return NextResponse.json({ ok: false, error: 'missing game or score' }, { status: 400 });
    }

    const personId = typeof body.personId === 'number' ? body.personId : undefined;
    if (!personId) return NextResponse.json({ ok: false, error: 'missing personId' }, { status: 400 });

    const rewards = await getRewardsConfig();
    const game = String(body.game);
    const outcome = String(body.outcome ?? '').toLowerCase();
    const rawScore = Number(body.score ?? 0);

    let total = 0;
    if (game === 'clickrush') {
      const isWin = rawScore >= rewards.clickrushWinScoreThreshold;
      total = isWin ? rewards.clickrushWinCoins : rewards.clickrushLoseCoins;
    } else if (game === 'tictactoe') {
      if (outcome === 'win') total = rewards.tictactoeWinCoins;
      else if (outcome === 'lose') total = rewards.tictactoeLoseCoins;
      else total = 0;
    } else if (game === 'chess') {
      if (outcome === 'win') total = rewards.chessWinCoins;
      else if (outcome === 'lose') total = rewards.chessLoseCoins;
      else total = 0;
    } else if (game === 'connect4') {
      if (outcome === 'win') total = rewards.connect4WinCoins;
      else if (outcome === 'lose') total = rewards.connect4LoseCoins;
      else total = 0;
    }

    const updatedPerson = await awardCoinsToPerson(personId, total, { game: body.game, playerName: body.player, score: body.score });

    // Ao jogar: fome, energia e higiene descem
    const petId = typeof body.petId === 'number' ? body.petId : 1;
    await applyItemEffect(petId, { hunger: -5, energy: -8, hygiene: -3 });

    return NextResponse.json({ ok: true, coinsAwarded: total, person: updatedPerson });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // optional: return available minigames / rules
  return NextResponse.json({ games: [ { id: 'clickrush', name: 'Click Rush', desc: 'Clique rápido para ganhar moedas (escolha pessoa antes)' } ] });
}
