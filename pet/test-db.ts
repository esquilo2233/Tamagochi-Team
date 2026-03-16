// Teste de conexão com o banco
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

console.log("DATABASE_URL configurada:", !!connectionString);
console.log("NODE_ENV:", process.env.NODE_ENV);

if (!connectionString) {
    console.error("❌ DATABASE_URL não está definida!");
    process.exit(1);
}

try {
    const adapter = new PrismaPg({
        connectionString,
    });

    const prisma = new PrismaClient({
        adapter,
        log: ["error", "warn", "info"],
    });

    console.log("✅ Adapter criado com sucesso");

    const result = await prisma.person.findFirst({
        select: { id: true, name: true },
    });

    console.log("✅ Conexão bem-sucedida!");
    console.log("Primeira pessoa:", result);

    await prisma.$disconnect();
} catch (error) {
    console.error("❌ Erro na conexão:", error);
    process.exit(1);
}
