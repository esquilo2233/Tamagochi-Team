import { NextResponse } from "next/server";
import { getOrCreatePet } from "../../../../lib/pet";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const pet = await getOrCreatePet();
    if (!pet) {
      return NextResponse.json({ ok: false, error: "Pet not found" }, { status: 404 });
    }

    // Resetar todos os stats para 100
    const updatedPet = await prisma.pet.update({
      where: { id: pet.id },
      data: {
        hunger: 100,
        energy: 100,
        happiness: 100,
        hygiene: 100,
        life: 100,
        lastUpdate: new Date(),
        sleepStartedAt: null, // Acordar se estiver a dormir
      },
    });

    return NextResponse.json({
      ok: true,
      pet: updatedPet,
      message: "Stats resetados com sucesso!",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
