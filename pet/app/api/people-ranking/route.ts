import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// API pública para ranking de moedas - não requer autenticação
// Apenas retorna nome e moedas das pessoas (dados não sensíveis)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = url.searchParams.get("limit");
    const n = limit ? parseInt(limit, 10) : undefined;

    const people = await prisma.person.findMany({
      select: {
        id: true,
        name: true,
        coins: true,
      },
      orderBy: { coins: "desc" },
      ...(Number.isFinite(n) && n! > 0 ? { take: n } : {}),
    });

    return NextResponse.json(people);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
