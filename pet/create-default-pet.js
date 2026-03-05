const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient(); // Isso já funciona se o schema estiver configurado corretamente

async function main() {
  const existingPet = await prisma.pet.findFirst();
  if (!existingPet) {
    console.log("Criando pet padrão...");
    const pet = await prisma.pet.create({
      data: {
        name: "Meu Pet",
        hunger: 100,
        energy: 100,
        happiness: 100,
        hygiene: 100,
        life: 100,
        appearance: '/samurai.svg'
      }
    });
    console.log("Pet criado com ID:", pet.id);
  } else {
    console.log("Pet já existe com ID:", existingPet.id);
    console.log("Appearance atual:", existingPet.appearance);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
