const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Listar todas as pessoas
  const people = await prisma.person.findMany({
    select: { id: true, name: true, code: true, role: true }
  });

  console.log('\n📋 Pessoas registadas:');
  people.forEach(p => {
    console.log(`  - ${p.name} (${p.code}) - Role: ${p.role || 'user'}`);
  });

  // Pedir código da pessoa para promover
  const code = process.argv[2];

  if (!code) {
    console.log('\n❌ Uso: node scripts/promote-admin.js <CODIGO>');
    console.log('   Exemplo: node scripts/promote-admin.js ABC123\n');
    await prisma.$disconnect();
    return;
  }

  // Promover para admin
  const updated = await prisma.person.update({
    where: { code: code.toUpperCase() },
    data: { role: 'admin' }
  });

  console.log(`\n✅ ${updated.name} (${updated.code}) agora é ADMIN!\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
