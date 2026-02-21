import { NextResponse } from "next/server";
import { createPerson } from "../../../lib/pet";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ ok: false, error: "Nome é obrigatório." }, { status: 400 });
    }

    const person = await createPerson(name, "user");
    return NextResponse.json({
      ok: true,
      person: { id: person.id, name: person.name, code: person.code },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
