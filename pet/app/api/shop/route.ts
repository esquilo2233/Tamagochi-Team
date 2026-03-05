import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { purchaseItem } from "../../../lib/pet";

// Rate limiting simples em memória
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(personId: number): boolean {
  const now = Date.now();
  const windowMs = 10000; // 10 segundos
  const maxRequests = 5; // 5 requisições por janela

  const key = `person_${personId}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  rateLimitMap.set(key, record);
  return true;
}

// Limpar rate limit antigo a cada minuto
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      where: { type: { not: "__system" } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(items);
  } catch (err: any) {
    console.error("Erro ao buscar itens:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validar tipos e valores
    const personId = typeof body?.personId === "number" ? body.personId : null;
    const itemId = typeof body?.itemId === "number" ? body.itemId : null;
    const petId = typeof body?.petId === "number" ? body.petId : null;

    if (!personId || !itemId || !petId) {
      return NextResponse.json(
        { ok: false, error: "Parâmetros inválidos" },
        { status: 400 },
      );
    }

    // Validar IDs positivos
    if (personId <= 0 || itemId <= 0 || petId <= 0) {
      return NextResponse.json(
        { ok: false, error: "IDs devem ser positivos" },
        { status: 400 },
      );
    }

    // Rate limiting
    if (!checkRateLimit(personId)) {
      return NextResponse.json(
        { ok: false, error: "Muitas requisições. Aguarde alguns segundos." },
        { status: 429 },
      );
    }

    // Verificar se pessoa existe antes de comprar
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: { id: true, coins: true, role: true },
    });

    if (!person) {
      return NextResponse.json(
        { ok: false, error: "Pessoa não encontrada" },
        { status: 404 },
      );
    }

    const res = await purchaseItem(personId, itemId, petId);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("Erro na compra:", err);

    // Mensagens de erro genéricas para não expor detalhes internos
    const errorMessage = err.message?.toLowerCase() || "";

    if (errorMessage.includes("insufficient_coins")) {
      return NextResponse.json(
        { ok: false, error: "Saldo insuficiente" },
        { status: 400 },
      );
    }

    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { ok: false, error: "Item ou pessoa não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Erro ao processar compra" },
      { status: 500 },
    );
  }
}
