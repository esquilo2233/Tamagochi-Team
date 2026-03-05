import { NextResponse } from "next/server";
import { createPerson } from "../../../lib/pet";

// Lista de roles permitidas para registo normal
const ALLOWED_ROLES = ["user", "player"];
const DEFAULT_ROLE = "user";

// Sanitizar input de texto
function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  // Remover caracteres especiais perigosos
  return input
    .trim()
    .replace(/[<>\"\'%;()&+$]/g, "")
    .slice(0, 50); // Limite de 50 caracteres
}

// Validar nome
function isValidName(name: string): boolean {
  // Apenas letras, números, espaços e alguns caracteres especiais seguros
  const nameRegex = /^[a-zA-Z0-9\s\u00C0-\u017F_-]+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 50;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validar e sanitizar nome
    const rawName = typeof body?.name === "string" ? body.name : "";
    const name = sanitizeInput(rawName);

    if (!name || !isValidName(name)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Nome inválido. Use apenas letras, números, espaços, hífens e underscores (2-50 caracteres).",
        },
        { status: 400 },
      );
    }

    // Ignorar role enviado pelo usuário - sempre criar como "user"
    // Nunca permitir que o usuário escolha sua própria role
    const person = await createPerson(name, DEFAULT_ROLE);

    return NextResponse.json({
      ok: true,
      person: {
        id: person.id,
        name: person.name,
        code: person.code,
        role: person.role ?? DEFAULT_ROLE,
      },
    });
  } catch (err: any) {
    console.error("Erro no registro:", err);
    return NextResponse.json(
      { ok: false, error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
