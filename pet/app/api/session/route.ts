import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPersonByCode } from "../../../lib/pet";
import { encrypt, decrypt } from "../../../lib/encryption";

const SESSION_COOKIE = "person_session";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 dias

// Sanitizar código
function sanitizeCode(code: string): string {
  if (typeof code !== "string") return "";
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawCode = typeof body?.code === "string" ? body.code : "";
    const code = sanitizeCode(rawCode);

    // Validar formato do código
    if (!code || code.length !== 6 || !/^[A-Z0-9]{6}$/.test(code)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Código inválido. Use 6 caracteres alfanuméricos.",
        },
        { status: 400 },
      );
    }

    const person = await getPersonByCode(code);
    if (!person) {
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 200),
      );
      return NextResponse.json(
        { ok: false, error: "Código não encontrado." },
        { status: 404 },
      );
    }

    const cookieStore = await cookies();

    // Encriptar dados da sessão antes de guardar no cookie
    const sessionData = {
      code: person.code,
      id: person.id,
      role: person.role ?? "user",
      ts: Date.now(),
    };
    const encryptedSession = encrypt(JSON.stringify(sessionData));

    cookieStore.set(SESSION_COOKIE, encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    return NextResponse.json({
      ok: true,
      person: {
        id: person.id,
        name: person.name,
        role: person.role ?? null,
        coins: person.coins ?? 0,
      },
    });
  } catch (err: any) {
    console.error("Erro na sessão:", err);
    return NextResponse.json(
      { ok: false, error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const encryptedSession = cookieStore.get(SESSION_COOKIE)?.value;

    if (!encryptedSession) {
      return NextResponse.json({ ok: false, person: null });
    }

    // Desencriptar sessão
    let sessionData: { code: string; id: number; ts: number; role?: string };
    try {
      const decrypted = decrypt(encryptedSession);
      sessionData = JSON.parse(decrypted);
    } catch (e) {
      console.error("[Session] Erro ao desencriptar:", e);
      cookieStore.delete(SESSION_COOKIE);
      return NextResponse.json({ ok: false, person: null });
    }

    // Validar sessão
    if (!sessionData?.code || !sessionData?.id) {
      cookieStore.delete(SESSION_COOKIE);
      return NextResponse.json({ ok: false, person: null });
    }

    const person = await getPersonByCode(sessionData.code);
    if (!person) {
      cookieStore.delete(SESSION_COOKIE);
      return NextResponse.json({ ok: false, person: null });
    }

    return NextResponse.json({
      ok: true,
      person: {
        id: person.id,
        name: person.name,
        role: person.role ?? null,
        coins: person.coins ?? 0,
      },
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
