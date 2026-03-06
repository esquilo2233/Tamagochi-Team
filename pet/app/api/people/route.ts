import { NextResponse } from "next/server";
import { listPeople, createPerson, deletePerson } from "../../../lib/pet";
import { requireAdmin } from "@/lib/auth-api";
import { prisma } from "@/lib/prisma";

async function ensurePeopleAccess() {
  return await requireAdmin();
}

export async function GET(req: Request) {
  try {
    const allowed = await ensurePeopleAccess();
    if (!allowed)
      return NextResponse.json(
        { ok: false, error: "Sem permissão" },
        { status: 403 },
      );

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      const person = await prisma.person.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          name: true,
          role: true,
          coins: true,
          createdAt: true,
        },
      });
      return NextResponse.json(person);
    }
    const people = await listPeople();
    // Não devolver códigos
    const safePeople = people.map(({ code, ...rest }: any) => rest);
    return NextResponse.json(safePeople);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const allowed = await ensurePeopleAccess();
    if (!allowed)
      return NextResponse.json(
        { ok: false, error: "Sem permissão" },
        { status: 403 },
      );

    const body = await req.json();
    if (!body || !body.name)
      return NextResponse.json(
        { ok: false, error: "Nome obrigatório" },
        { status: 400 },
      );

    const name = body.name.trim();
    if (!name)
      return NextResponse.json(
        { ok: false, error: "Nome não pode ser vazio" },
        { status: 400 },
      );

    // Verificar se já existe pessoa com este nome
    const existingPerson = await prisma.person.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive", // Case insensitive
        },
      },
    });

    if (existingPerson) {
      return NextResponse.json(
        {
          ok: false,
          error: `Já existe uma pessoa com o nome "${name}". Escolhe outro nome.`,
        },
        { status: 400 },
      );
    }

    const person = await createPerson(name, body.role);
    return NextResponse.json(person);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const allowed = await ensurePeopleAccess();
    if (!allowed)
      return NextResponse.json(
        { ok: false, error: "Sem permissão" },
        { status: 403 },
      );

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { ok: false, error: "missing id" },
        { status: 400 },
      );
    await deletePerson(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

// optional: return single person by id via query ?id=
export async function GET_BY_ID(req: Request) {
  try {
    const allowed = await ensurePeopleAccess();
    if (!allowed)
      return NextResponse.json(
        { ok: false, error: "Sem permissão" },
        { status: 403 },
      );

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { ok: false, error: "missing id" },
        { status: 400 },
      );
    const person = await prisma.person.findUnique({
      where: { id: Number(id) },
    });
    return NextResponse.json(person);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}
