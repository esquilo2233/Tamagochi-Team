import { NextResponse } from "next/server";
import { getOrCreatePet, performAction, applyItemEffect, updatePetStateWithWork, updatePetAvatar } from "../../../lib/pet";
import { put } from "@vercel/blob";
import { DEFAULT_SAMURAI_SVG } from "../../../lib/default-avatar";

export async function GET() {
  // update state (work sessions + decay) then return pet
  await updatePetStateWithWork();
  let pet = await getOrCreatePet();
  
  // Se o pet não tem avatar, fazer upload do padrão para o blob
  if (!pet.appearance) {
    try {
      const svgBuffer = Buffer.from(DEFAULT_SAMURAI_SVG, 'utf-8');
      const blob = await put("avatars/default-samurai.svg", svgBuffer, {
        access: 'public',
        contentType: 'image/svg+xml',
        addRandomSuffix: false,
      });
      
      // Atualizar o pet com a URL do blob
      pet = await updatePetAvatar(blob.url);
    } catch (e) {
      // Se falhar (ex: blob já existe ou erro de conexão), continuar sem avatar
      // O frontend usará fallback local
    }
  }
  
  return NextResponse.json(pet);
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (action) {
      const pet = await getOrCreatePet();
      const updated = await performAction(pet.id, action as any);
      return NextResponse.json(updated);
    }

    const body = await req.json();
    if (body && body.effect) {
      const pet = await getOrCreatePet();
      const updated = await applyItemEffect(pet.id, body.effect);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ ok: false, error: "missing action or effect" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
