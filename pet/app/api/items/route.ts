import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";

const SESSION_COOKIE = "person_session";

async function ensureAdminAccess() {
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
    const items = await prisma.item.findMany({
      where: { type: { not: "__system" } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const allowed = await ensureAdminAccess();
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Sem permissão" },
        { status: 403 },
      );
    }

    const body = await req.json();
    if (!body?.name || !body?.type || typeof body?.price !== "number") {
      return NextResponse.json(
        { ok: false, error: "missing params" },
        { status: 400 },
      );
    }

    const item = await prisma.item.create({
      data: {
        name: body.name,
        type: body.type,
        price: body.price,
        effect: body.effect ?? null,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const allowed = await ensureAdminAccess();
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Sem permissão" },
        { status: 403 },
      );
    }

    const body = await req.json();
    if (!body || typeof body.id !== "number") {
      return NextResponse.json(
        { ok: false, error: "missing id" },
        { status: 400 },
      );
    }

    const item = await prisma.item.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.effect !== undefined && { effect: body.effect }),
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const allowed = await ensureAdminAccess();
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Sem permissão" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!id)
      return NextResponse.json(
        { ok: false, error: "missing id" },
        { status: 400 },
      );

    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}
