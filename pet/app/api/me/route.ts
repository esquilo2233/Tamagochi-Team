import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth-api";

/**
 * API para obter dados do usuário autenticado
 * Retorna apenas name e coins por segurança
 */
export async function GET() {
    try {
        const person = await validateSession();

        if (!person) {
            return NextResponse.json(null, { status: 401 });
        }

        return NextResponse.json({
            name: person.name,
            coins: person.coins ?? 0,
        });
    } catch (err: any) {
        console.error("[GET /api/me] Erro:", err);
        return NextResponse.json(null, { status: 500 });
    }
}
