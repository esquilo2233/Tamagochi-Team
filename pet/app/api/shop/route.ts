import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { purchaseItem } from "../../../lib/pet";

export async function GET() {
  const items = await prisma.item.findMany({ where: { type: { not: '__system' } }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body.personId !== 'number' || typeof body.itemId !== 'number' || typeof body.petId !== 'number') {
      return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
    }

    const res = await purchaseItem(body.personId, body.itemId, body.petId);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

