import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Desabilitar verificação de certificado SSL (apenas para Supabase na Vercel)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Supabase integration usa POSTGRES_URL ou POSTGRES_PRISMA_URL
const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;

console.log("[Prisma] DATABASE_URL configurada:", !!connectionString);
console.log("[Prisma] Variáveis disponíveis:", {
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
});

if (!connectionString) {
    console.error("[Prisma] Nenhuma URL de banco encontrada!");
}

// PrismaPg com SSL para Supabase
const adapter = new PrismaPg({
    connectionString,
});

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: ["error", "warn", "info"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
