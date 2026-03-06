const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Verificar roles dos utilizadores\n');

  // Listar todas as pessoas
  const people = await prisma.person.findMany({
    select: { id: true, name: true, code: true, role: true }
  });

  console.log('📋 Utilizadores registados:');
  people.forEach(p => {
    console.log(`  - ${p.name} (${p.code}) - Role: "${p.role || 'null'}"`);
  });

  // Contar admins e gestores
  const adminCount = people.filter(p => p.role === 'admin').length;
  const gestorCount = people.filter(p => p.role === 'gestor').length;
  const userCount = people.filter(p => !p.role || p.role === 'user').length;

  console.log(`\n📊 Resumo:`);
  console.log(`  👑 Admins: ${adminCount}`);
  console.log(`  📝 Gestores: ${gestorCount}`);
  console.log(`  👤 Users: ${userCount}`);

  // Se não há admins, perguntar se quer criar um
  if (adminCount === 0) {
    console.log('\n⚠️  Não há administradores!\n');
    console.log('Para promover um utilizador a admin, usa:');
    console.log('  node scripts/promote-admin.js <CODIGO>\n');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
