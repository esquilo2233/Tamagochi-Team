import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth-api";
import { z } from "zod";

// Schema de validação
const voteSchema = z.object({
    optionIdx: z.number().int().min(0),
    coins: z.number().int().min(1),
});

// POST - Apostar em uma bet
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    let betId: number | undefined;

    try {
        // 1. Validar autenticação
        const person = await validateSession();
        if (!person) {
            return NextResponse.json(
                { error: "Não autorizado. Faça login." },
                { status: 401 },
            );
        }

        // 2. Parse e validação do ID da bet
        const { id } = await params;
        betId = parseInt(id, 10);
        if (isNaN(betId) || betId <= 0) {
            return NextResponse.json(
                { error: "ID da bet inválido" },
                { status: 400 },
            );
        }

        // 3. Parse e validação do body
        const body = await request.json();
        const validation = voteSchema.safeParse(body);
        if (!validation.success) {
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

        const { optionIdx, coins } = validation.data;

        // 4. Validar limite de coins
        if (coins > 10000) {
            return NextResponse.json(
                { error: "Valor máximo de aposta é 10000 coins" },
                { status: 400 },
            );
        }

        // 5. Buscar bet
        const bet = await prisma.bets.findUnique({
            where: { id: betId },
        });

        if (!bet) {
            return NextResponse.json(
                { error: "Bet não encontrada" },
                { status: 404 },
            );
        }

        // 6. Verificar status da bet
        if (bet.status !== "active") {
            return NextResponse.json(
                { error: "Esta bet está fechada para apostas" },
                { status: 400 },
            );
        }

        // 7. Verificar se bet expirou
        if (bet.endsAt && new Date(bet.endsAt) <= new Date()) {
            return NextResponse.json(
                { error: "Esta bet expirou" },
                { status: 400 },
            );
        }

        // 8. Validar opção
        const options = (bet.options as any[]) || [];
        if (optionIdx < 0 || optionIdx >= options.length) {
            return NextResponse.json(
                { error: "Opção inválida" },
                { status: 400 },
            );
        }

        // 9. Verificar se já votou (QUALQUER opção nesta bet)
        const existingVote = await prisma.bet_votes.findFirst({
            where: {
                betId,
                personId: person.id,
            },
        });

        if (existingVote) {
            return NextResponse.json(
                { error: "Você já apostou nesta bet" },
                { status: 400 },
            );
        }

        // 10. Verificar coins suficientes
        const personData = await prisma.person.findUnique({
            where: { id: person.id },
            select: { coins: true },
        });

        if (!personData || personData.coins < coins) {
            return NextResponse.json(
                { error: "Coins insuficientes" },
                { status: 400 },
            );
        }

        // 11. Realizar aposta em transação atômica
        const result = await prisma.$transaction(
            async (tx: any) => {
                // Deduzir coins da pessoa
                await tx.person.update({
                    where: { id: person.id },
                    data: { coins: { decrement: coins } },
                });

                // Criar o voto
                const vote = await tx.bet_votes.create({
                    data: {
                        betId,
                        personId: person.id,
                        optionIdx,
                        coins,
                    },
                });

                return vote;
            },
            {
                timeout: 10000, // 10 segundos
            },
        );

        // 12. Log da aposta
        await prisma.systemLog.create({
            data: {
                level: "info",
                message: `Aposta realizada`,
                context: {
                    betId,
                    personId: person.id,
                    optionIdx,
                    coins,
                    personCode: person.code,
                },
                source: "bets-vote-api",
            },
        });

        return NextResponse.json({
            success: true,
            vote: result,
            message: "Aposta realizada com sucesso!",
        });
    } catch (error: any) {
        console.error("[POST /api/bets/[id]/vote] Erro:", error);

        // Log de erro
        try {
            await prisma.systemLog.create({
                data: {
                    level: "error",
                    message: `Erro ao realizar aposta`,
                    context: {
                        betId: betId,
                        error: String(error),
                    },
                    source: "bets-vote-api",
                },
            });
        } catch {}

        // Verificar se é erro de transação
        if (error?.code === "P2034") {
            return NextResponse.json(
                { error: "Conflito na transação. Tente novamente." },
                { status: 409 },
            );
        }

        return NextResponse.json(
            { error: "Erro ao realizar aposta" },
            { status: 500 },
        );
    }
}
