import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listPeople, createPerson, deletePerson } from "../../../lib/pet";
import { prisma } from "../../../lib/prisma";

const SESSION_COOKIE = "person_session";

async function ensurePeopleAccess() {
  const cookieStore = await cookies();
  const code = cookieStore.get(SESSION_COOKIE)?.value;
  if (!code) return null;

  const person = await prisma.person.findUnique({ where: { code } });
  if (!person) return null;

  const role = (person.role ?? "").trim().toLowerCase();
  if (role !== "admin" && role !== "gestor") return null;
  return person;
}

export async function GET(req: Request) {
  try {
    const allowed = await ensurePeopleAccess();
    if (!allowed) return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id) {
      const person = await prisma.person.findUnique({ where: { id: Number(id) } });
      return NextResponse.json(person);
    }
    const people = await listPeople();
    return NextResponse.json(people);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const allowed = await ensurePeopleAccess();
    if (!allowed) return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });

    const body = await req.json();
    if (!body || !body.name) return NextResponse.json({ ok: false, error: "missing name" }, { status: 400 });
    const person = await createPerson(body.name, body.role);
    return NextResponse.json(person);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const allowed = await ensurePeopleAccess();
    if (!allowed) return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });
    await deletePerson(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// optional: return single person by id via query ?id=
export async function GET_BY_ID(req: Request) {
  try {
    const allowed = await ensurePeopleAccess();
    if (!allowed) return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });
    const person = await prisma.person.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(person);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
