import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRewardsConfig, saveRewardsConfig } from "../../../../lib/pet";
import { prisma } from "../../../../lib/prisma";

const SESSION_COOKIE = "person_session";

async function ensureCenasAccess() {
  const cookieStore = await cookies();
  const code = cookieStore.get(SESSION_COOKIE)?.value;
  if (!code) return null;

  const person = await prisma.person.findUnique({ where: { code } });
  if (!person) return null;

  const role = (person.role ?? "").trim().toLowerCase();
  if (role !== "admin" && role !== "gestor") return null;
  return person;
}

export async function GET() {
  try {
    const allowed = await ensureCenasAccess();
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Sem permissão para aceder ao painel Cenas." }, { status: 403 });
    }

    const config = await getRewardsConfig();
    return NextResponse.json({ ok: true, config });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const allowed = await ensureCenasAccess();
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Sem permissão para alterar configurações." }, { status: 403 });
    }

    const body = await req.json();
    const config = await saveRewardsConfig(body ?? {});
    return NextResponse.json({ ok: true, config });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
