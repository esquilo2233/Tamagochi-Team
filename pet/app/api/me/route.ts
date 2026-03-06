import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth-api";

/**
 * API minimalista para a homepage
 * Devolve APENAS nome e moedas da pessoa autenticada
 * Sem código, sem role, sem outros dados sensíveis
 */
export async function GET() {
  try {
    const person = await validateSession();

    if (!person) {
      return NextResponse.json({
        ok: false,
        person: null
      });
    }

    return NextResponse.json({
      ok: true,
      person: {
        name: person.name,
        coins: person.coins ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: "Erro interno"
    }, { status: 500 });
  }
}
