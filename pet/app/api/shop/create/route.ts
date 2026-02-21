import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.name || !body.type || typeof body.price !== 'number') {
      return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        name: body.name,
        type: body.type,
        price: body.price,
        effect: body.effect || null,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
