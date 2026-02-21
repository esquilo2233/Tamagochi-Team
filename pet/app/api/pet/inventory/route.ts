import { NextResponse } from "next/server";
import { getOrCreatePet, listFoodInventory } from "../../../../lib/pet";

export async function GET() {
  try {
    const pet = await getOrCreatePet();
    const inventory = await listFoodInventory(pet.id);
    return NextResponse.json(inventory);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
