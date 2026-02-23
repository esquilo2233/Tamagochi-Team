import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const items = body?.items as Array<{
            name: string;
            type: string;
            effect?: any;
            price: number;
        }>;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { ok: false, error: "Lista de itens inválida" },
                { status: 400 },
            );
        }

        // Validar itens
        for (const item of items) {
            if (!item.name || typeof item.name !== "string") {
                return NextResponse.json(
                    {
                        ok: false,
                        error: `Item sem nome válido: ${JSON.stringify(item)}`,
                    },
                    { status: 400 },
                );
            }
            if (!item.type || typeof item.type !== "string") {
                return NextResponse.json(
                    { ok: false, error: `Item sem tipo válido: ${item.name}` },
                    { status: 400 },
                );
            }
            if (typeof item.price !== "number" || item.price < 0) {
                return NextResponse.json(
                    { ok: false, error: `Preço inválido para ${item.name}` },
                    { status: 400 },
                );
            }
        }

        // Importar itens
        const created = await prisma.item.createMany({
            data: items.map((item) => ({
                name: item.name,
                type: item.type,
                effect: item.effect ?? null,
                price: item.price,
            })),
            skipDuplicates: true,
        });

        return NextResponse.json({
            ok: true,
            count: created.count,
            message: `${created.count} itens importados com sucesso!`,
        });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err.message },
            { status: 500 },
        );
    }
}
