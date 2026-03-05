import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, message, context, source } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem é obrigatória" },
        { status: 400 }
      );
    }

    const systemLog = await prisma.systemLog.create({
      data: {
        level: level || "info",
        message,
        context: context || null,
        source: source || null,
      },
    });

    return NextResponse.json(systemLog, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar log:", error);
    return NextResponse.json(
      { error: "Erro ao criar log" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    if (level) {
      where.level = level;
    }
    if (source) {
      where.source = source;
    }

    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    return NextResponse.json(
      { error: "Erro ao buscar logs" },
      { status: 500 }
    );
  }
}
