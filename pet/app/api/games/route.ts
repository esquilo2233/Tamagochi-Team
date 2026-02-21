import { NextResponse } from "next/server";
import { awardCoinsToPerson, applyItemEffect } from "../../../lib/pet";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // expected: { game: string, personId?: number, player?: string, score: number }
    if (!body || !body.game || typeof body.score !== 'number') {
      return NextResponse.json({ ok: false, error: 'missing game or score' }, { status: 400 });
    }

    const personId = typeof body.personId === 'number' ? body.personId : undefined;
    if (!personId) return NextResponse.json({ ok: false, error: 'missing personId' }, { status: 400 });

    // simple reward formula: 1 coin per 3 points
    const coins = Math.max(0, Math.floor(body.score / 3));
    const bonus = body.score >= 50 ? 5 : 0;
    const total = coins + bonus;

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
