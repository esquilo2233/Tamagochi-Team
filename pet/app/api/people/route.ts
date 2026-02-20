import { NextResponse } from "next/server";
import { listPeople, createPerson } from "../../../lib/pet";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
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
    const body = await req.json();
    if (!body || !body.name) return NextResponse.json({ ok: false, error: "missing name" }, { status: 400 });
    const person = await createPerson(body.name, body.role);
    return NextResponse.json(person);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// optional: return single person by id via query ?id=
export async function GET_BY_ID(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });
    const person = await prisma.person.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(person);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
