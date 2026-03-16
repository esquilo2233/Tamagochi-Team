import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession, requireAdmin } from "@/lib/auth-api";
import { z } from "zod";

// Schema de validação
const createBetSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional().nullable(),
    endsAt: z.string().optional().nullable(),
    options: z
        .array(
            z.object({
                label: z.string().min(1).max(100),
            }),
        )
        .min(2)
        .max(10),
});

// GET - Listar todas as bets
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const status = url.searchParams.get("status") || "active";
        const limit = parseInt(url.searchParams.get("limit") || "20", 10);

        // Validar limit
        if (isNaN(limit) || limit < 1 || limit > 100) {
            return NextResponse.json(
                { error: "Limite inválido" },
                { status: 400 },
            );
        }

        const bets = await prisma.bets.findMany({
            where: status === "all" ? {} : { status },
            include: {
                creator: {
                    select: { id: true, name: true, code: true },
                },
                bet_votes: {
                    select: {
                        optionIdx: true,
                        coins: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        // Processar bets para calcular totais
        const processedBets = bets.map((bet: any) => {
            const options = (bet.options as any[]) || [];
            const votes = bet.bet_votes || [];

            // Calcular total apostado por opção
            const optionsWithTotals = options.map((opt: any, idx: number) => {
                const totalCoins = votes
                    .filter((v: any) => v.optionIdx === idx)
                    .reduce((sum: number, v: any) => sum + v.coins, 0);
                return { ...opt, totalCoins };
            });

            const totalPool = optionsWithTotals.reduce(
                (sum: number, opt: any) => sum + (opt.totalCoins || 0),
                0,
            );

            return {
                ...bet,
                options: optionsWithTotals,
                totalPool,
                totalVotes: votes.length,
            };
        });

        return NextResponse.json(processedBets);
    } catch (error) {
        console.error("[GET /api/bets] Erro:", error);
        return NextResponse.json(
            { error: "Erro ao buscar bets" },
            { status: 500 },
        );
    }
}

// POST - Criar nova bet (apenas admin)
export async function POST(request: NextRequest) {
    try {
        // Validar autenticação E permissão de admin
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json(
                {
                    error: "Acesso negado. Apenas administradores podem criar bets.",
                },
                { status: 403 },
            );
        }

        const body = await request.json();

        // Validar dados com Zod
        const validation = createBetSchema.safeParse(body);
        if (!validation.success) {
            console.error("[Validation Error]", validation.error.issues);
            return NextResponse.json(
                {
                    error: "Dados inválidos",
                    details: validation.error.issues.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                },
                { status: 400 },
            );
        }

        const { title, description, options, endsAt } = validation.data;

        // Validar data de término (se fornecida)
        if (endsAt) {
            const endsAtDate = new Date(endsAt);
            const now = new Date();
            if (endsAtDate <= now) {
                return NextResponse.json(
                    { error: "A data de término deve ser no futuro" },
                    { status: 400 },
                );
            }
        }

        // Criar bet
        const bet = await prisma.bets.create({
            data: {
                title,
                description: description || null,
                creatorId: admin.id,
                options: options.map((opt) => ({
                    label: opt.label,
                })),
                endsAt: endsAt ? new Date(endsAt) : null,
                status: "active",
            },
            include: {
                creator: {
                    select: { id: true, name: true, code: true },
                },
            },
        });

        // Log da criação
        await prisma.systemLog.create({
            data: {
                level: "info",
                message: `Bet criada por admin`,
                context: { betId: bet.id, title: bet.title, adminId: admin.id },
                source: "bets-api",
            },
        });

        return NextResponse.json(bet, { status: 201 });
    } catch (error) {
        console.error("[POST /api/bets] Erro:", error);

        // Log de erro
        await prisma.systemLog.create({
            data: {
                level: "error",
                message: `Erro ao criar bet`,
                context: { error: String(error) },
                source: "bets-api",
            },
        });

        return NextResponse.json(
            { error: "Erro ao criar bet" },
            { status: 500 },
        );
    }
}
