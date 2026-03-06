import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth-api";

/**
 * API para obter o próprio código de acesso
 * Apenas o próprio utilizador pode ver o seu código
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

    // Devolver código APENAS para o próprio utilizador
    return NextResponse.json({
      ok: true,
      person: {
        id: person.id,
        name: person.name,
        code: person.code,  // Só o próprio pode ver
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
