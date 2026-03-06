import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDecayConfig, saveDecayConfig } from "../../../../lib/pet";
import { prisma } from "../../../../lib/prisma";
import { decrypt } from "../../../../lib/encryption";

const SESSION_COOKIE = "person_session";

async function ensureCenasAccess() {
  const cookieStore = await cookies();
  const encryptedSession = cookieStore.get(SESSION_COOKIE)?.value;

  if (!encryptedSession) {
    console.log("[Settings/decay] Sem cookie de sessão");
    return null;
  }

  // Desencriptar sessão
  let sessionData: { code: string; id: number; role?: string };
  try {
    const decrypted = decrypt(encryptedSession);
    sessionData = JSON.parse(decrypted);
    console.log("[Settings/decay] Sessão desencriptada:", sessionData);
  } catch (e) {
    console.error("[Settings/decay] Erro ao desencriptar sessão:", e);
    return null;
  }

  // Validar sessão
  if (!sessionData?.code) {
    console.log("[Settings/decay] Código inválido na sessão");
    return null;
  }

  const person = await prisma.person.findUnique({
    where: { code: sessionData.code },
  });
  if (!person) {
    console.log("[Settings/decay] Pessoa não encontrada:", sessionData.code);
    return null;
  }

  console.log(
    "[Settings/decay] Pessoa encontrada:",
    person.name,
    "role:",
    person.role,
  );

  const role = (person.role ?? "").trim().toLowerCase();
  if (role !== "admin" && role !== "gestor") {
    console.log("[Settings/decay] Acesso negado - role:", person.role);
    return null;
  }

  return person;
}

export async function GET() {
  try {
    const allowed = await ensureCenasAccess();
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Sem permissão para aceder ao painel Cenas." },
        { status: 403 },
      );
    }

    const config = await getDecayConfig();
    return NextResponse.json({ ok: true, config });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const allowed = await ensureCenasAccess();
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Sem permissão para alterar configurações." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const config = await saveDecayConfig(body ?? {});
    return NextResponse.json({ ok: true, config });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}
