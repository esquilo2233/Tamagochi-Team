// Load .env for local scripts and ensure DATABASE_URL is available
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        accelerateUrl: process.env.DATABASE_URL,
        log: ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
