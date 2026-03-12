// Load .env for local scripts and ensure DATABASE_URL is available
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// For Prisma v7 with Prisma Accelerate, pass accelerateUrl from env if present.
const clientOptions: any = { log: ["error"] };
if (process.env.DATABASE_URL) {
    clientOptions.accelerateUrl = process.env.DATABASE_URL;
}

export const prisma = globalForPrisma.prisma || new PrismaClient(clientOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
