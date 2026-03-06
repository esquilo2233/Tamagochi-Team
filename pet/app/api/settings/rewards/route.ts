import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRewardsConfig, saveRewardsConfig } from "../../../../lib/pet";
import { prisma } from "../../../../lib/prisma";
import { decrypt } from "../../../../lib/encryption";

const SESSION_COOKIE = "person_session";

async function ensureCenasAccess() {
  const cookieStore = await cookies();
  const encryptedSession = cookieStore.get(SESSION_COOKIE)?.value;

  if (!encryptedSession) {
    console.log("[Settings/rewards] Sem cookie de sessão");
    return null;
  }

  // Desencriptar sessão
  let sessionData: { code: string; id: number; role?: string };
  try {
    const decrypted = decrypt(encryptedSession);
    sessionData = JSON.parse(decrypted);
    console.log("[Settings/rewards] Sessão desencriptada:", sessionData);
  } catch (e) {
    console.error("[Settings/rewards] Erro ao desencriptar sessão:", e);
    return null;
  }

  // Validar sessão
  if (!sessionData?.code) {
    console.log("[Settings/rewards] Código inválido na sessão");
    return null;
  }

  const person = await prisma.person.findUnique({
    where: { code: sessionData.code },
  });
  if (!person) {
    console.log("[Settings/rewards] Pessoa não encontrada:", sessionData.code);
    return null;
  }

  console.log(
    "[Settings/rewards] Pessoa encontrada:",
    person.name,
    "role:",
    person.role,
  );

  const role = (person.role ?? "").trim().toLowerCase();
  if (role !== "admin" && role !== "gestor") {
    console.log("[Settings/rewards] Acesso negado - role:", person.role);
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

    const config = await getRewardsConfig();
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
    const config = await saveRewardsConfig(body ?? {});
    return NextResponse.json({ ok: true, config });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}
