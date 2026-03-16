import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("[Prisma] DATABASE_URL não está definida!");
}

// Usar adapter apenas se DATABASE_URL estiver presente
const adapter = connectionString
    ? new PrismaPg({
          connectionString,
      })
    : undefined;

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        ...(adapter ? { adapter } : {}),
        log: ["error", "warn", "info"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
