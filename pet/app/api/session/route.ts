import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPersonByCode } from "../../../lib/pet";

const SESSION_COOKIE = "person_session";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 dias

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!code || code.length !== 6) {
      return NextResponse.json({ ok: false, error: "Código inválido. Use 6 caracteres." }, { status: 400 });
    }

    const person = await getPersonByCode(code);
    if (!person) {
      return NextResponse.json({ ok: false, error: "Código não encontrado." }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    return NextResponse.json({
      ok: true,
      person: { id: person.id, name: person.name, code: person.code, role: person.role ?? null, coins: person.coins ?? 0 },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const code = cookieStore.get(SESSION_COOKIE)?.value;
    if (!code) {
      return NextResponse.json({ ok: false, person: null });
    }

    const person = await getPersonByCode(code);
    if (!person) {
      cookieStore.delete(SESSION_COOKIE);
      return NextResponse.json({ ok: false, person: null });
    }

    return NextResponse.json({
      ok: true,
      person: { id: person.id, name: person.name, code: person.code, role: person.role ?? null, coins: person.coins ?? 0 },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, person: null });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
