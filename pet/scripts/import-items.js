/**
 * Script para importar itens padrão na loja
 * Executar: node scripts/import-items.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const items = [
  // ==================== COMIDAS ====================
  {
    name: '🍎 Maçã',
    type: 'comida',
    price: 5,
    effect: { hunger: 15, happiness: 5, life: 2 },
  },
  {
    name: '🍌 Banana',
    type: 'comida',
    price: 4,
    effect: { hunger: 12, energy: 5, happiness: 3 },
  },
  {
    name: '🍇 Uvas',
    type: 'comida',
    price: 6,
    effect: { hunger: 10, happiness: 8, life: 3 },
  },
  {
    name: '🍓 Morango',
    type: 'comida',
    price: 7,
    effect: { hunger: 8, happiness: 10, life: 4 },
  },
  {
    name: '🍊 Laranja',
    type: 'comida',
    price: 5,
    effect: { hunger: 12, life: 5, hygiene: 2 },
  },
  {
    name: '🍕 Pizza',
    type: 'comida',
    price: 15,
    effect: { hunger: 40, happiness: 15, energy: -5 },
  },
  {
    name: '🍔 Hambúrguer',
    type: 'comida',
    price: 12,
    effect: { hunger: 35, happiness: 10, energy: -3 },
  },
  {
    name: '🍟 Batatas Fritas',
    type: 'comida',
    price: 8,
    effect: { hunger: 20, happiness: 8, hygiene: -5 },
  },
  {
    name: '🍗 Frango',
    type: 'comida',
    price: 18,
    effect: { hunger: 45, energy: 10, life: 5 },
  },
  {
    name: '🍣 Sushi',
    type: 'comida',
    price: 20,
    effect: { hunger: 30, happiness: 15, life: 8 },
  },
  {
    name: '🍜 Ramen',
    type: 'comida',
    price: 14,
    effect: { hunger: 35, energy: 8, happiness: 5 },
  },
  {
    name: '🥗 Salada',
    type: 'comida',
    price: 10,
    effect: { hunger: 20, life: 10, hygiene: 5 },
  },
  {
    name: '🍦 Gelado',
    type: 'comida',
    price: 9,
    effect: { hunger: 15, happiness: 20, energy: -3 },
  },
  {
    name: '🍩 Donut',
    type: 'comida',
    price: 8,
    effect: { hunger: 18, happiness: 12, hygiene: -3 },
  },
  {
    name: '🍫 Chocolate',
    type: 'comida',
    price: 10,
    effect: { hunger: 15, happiness: 18, energy: 5 },
  },
  {
    name: '🧀 Queijo',
    type: 'comida',
    price: 11,
    effect: { hunger: 25, energy: 8, life: 3 },
  },
  {
    name: '🥚 Ovo',
    type: 'comida',
    price: 6,
    effect: { hunger: 18, energy: 6, life: 4 },
  },
  {
    name: '🍖 Carne',
    type: 'comida',
    price: 22,
    effect: { hunger: 50, energy: 15, life: 8 },
  },
  {
    name: '🥕 Cenoura',
    type: 'comida',
    price: 4,
    effect: { hunger: 10, life: 8, hygiene: 3 },
  },
  {
    name: '🌽 Milho',
    type: 'comida',
    price: 5,
    effect: { hunger: 15, energy: 5, life: 3 },
  },

  // ==================== BEBIDAS ====================
  {
    name: '💧 Água',
    type: 'bebida',
    price: 2,
    effect: { hunger: 5, life: 5, hygiene: 3 },
  },
  {
    name: '🥛 Leite',
    type: 'bebida',
    price: 6,
    effect: { hunger: 15, energy: 8, life: 6 },
  },
  {
    name: '☕ Café',
    type: 'bebida',
    price: 8,
    effect: { energy: 25, happiness: 5, hunger: -3 },
  },
  {
    name: '🍵 Chá',
    type: 'bebida',
    price: 7,
    effect: { energy: 15, happiness: 8, life: 5 },
  },
  {
    name: '🧃 Sumo Natural',
    type: 'bebida',
    price: 9,
    effect: { hunger: 12, happiness: 10, life: 6 },
  },
  {
    name: '🥤 Refrigerante',
    type: 'bebida',
    price: 6,
    effect: { hunger: 10, happiness: 15, energy: 8, hygiene: -5 },
  },
  {
    name: '🍹 Cocktail',
    type: 'bebida',
    price: 15,
    effect: { happiness: 25, energy: -10, hygiene: -5 },
  },
  {
    name: '🍺 Cerveja',
    type: 'bebida',
    price: 12,
    effect: { happiness: 20, energy: -15, hygiene: -8 },
  },
  {
    name: '🍷 Vinho',
    type: 'bebida',
    price: 18,
    effect: { happiness: 22, energy: -10, life: 3 },
  },
  {
    name: '🥤 Smoothie',
    type: 'bebida',
    price: 11,
    effect: { hunger: 18, happiness: 12, life: 8 },
  },

  // ==================== REMÉDIOS ====================
  {
    name: '💊 Analgésico',
    type: 'remedio',
    price: 15,
    effect: { life: 15, happiness: -5, energy: 5 },
  },
  {
    name: '🩹 Curativo',
    type: 'remedio',
    price: 12,
    effect: { life: 20, hygiene: 10 },
  },
  {
    name: '💉 Vacina',
    type: 'remedio',
    price: 30,
    effect: { life: 40, happiness: -10, energy: -5 },
  },
  {
    name: '🧴 Pomada',
    type: 'remedio',
    price: 18,
    effect: { life: 12, hygiene: 20 },
  },
  {
    name: '🌿 Xarope',
    type: 'remedio',
    price: 20,
    effect: { life: 25, energy: 10, happiness: -5 },
  },
  {
    name: '💊 Vitamina',
    type: 'remedio',
    price: 25,
    effect: { life: 20, energy: 15, happiness: 5 },
  },
  {
    name: '🏥 Kit Primeiros Socorros',
    type: 'remedio',
    price: 50,
    effect: { life: 50, hygiene: 15, happiness: -10 },
  },
  {
    name: '💤 Comprimido para Dormir',
    type: 'remedio',
    price: 22,
    effect: { energy: 50, happiness: -5, life: 5 },
  },

  // ==================== HIGIENE ====================
  {
    name: '🧼 Sabonete',
    type: 'higiene',
    price: 8,
    effect: { hygiene: 25, happiness: 5, life: 3 },
  },
  {
    name: '🪥 Escova de Dentes',
    type: 'higiene',
    price: 10,
    effect: { hygiene: 30, life: 5 },
  },
  {
    name: '🧴 Champô',
    type: 'higiene',
    price: 12,
    effect: { hygiene: 35, happiness: 8 },
  },
  {
    name: '🧻 Papel Higiénico',
    type: 'higiene',
    price: 5,
    effect: { hygiene: 15 },
  },
  {
    name: '🪒 Lâmina de Barbear',
    type: 'higiene',
    price: 9,
    effect: { hygiene: 20, happiness: 5 },
  },
  {
    name: '🧴 Desodorizante',
    type: 'higiene',
    price: 11,
    effect: { hygiene: 28, happiness: 6 },
  },
  {
    name: '🛁 Banho Completo',
    type: 'higiene',
    price: 20,
    effect: { hygiene: 50, happiness: 15, life: 5 },
  },
  {
    name: '💅 Corte de Unhas',
    type: 'higiene',
    price: 15,
    effect: { hygiene: 25, life: 3 },
  },

  // ==================== ENERGIA ====================
  {
    name: '⚡ Bebida Energética',
    type: 'energia',
    price: 14,
    effect: { energy: 40, happiness: 5, life: -3 },
  },
  {
    name: '🍫 Barra de Proteína',
    type: 'energia',
    price: 12,
    effect: { energy: 25, hunger: 15, life: 5 },
  },
  {
    name: '☕ Expresso Duplo',
    type: 'energia',
    price: 10,
    effect: { energy: 35, happiness: 3, hunger: -5 },
  },
  {
    name: '🥜 Nozes',
    type: 'energia',
    price: 13,
    effect: { energy: 20, hunger: 12, life: 8 },
  },
  {
    name: '🍯 Mel',
    type: 'energia',
    price: 11,
    effect: { energy: 18, happiness: 10, life: 6 },
  },

  // ==================== FELICIDADE ====================
  {
    name: '🎁 Presente',
    type: 'felicidade',
    price: 25,
    effect: { happiness: 40, hunger: -5 },
  },
  {
    name: '🎈 Balão',
    type: 'felicidade',
    price: 8,
    effect: { happiness: 20, energy: -3 },
  },
  {
    name: '🧸 Ursinho de Peluche',
    type: 'felicidade',
    price: 30,
    effect: { happiness: 50, life: 5 },
  },
  {
    name: '🎮 Jogo',
    type: 'felicidade',
    price: 35,
    effect: { happiness: 45, energy: -15 },
  },
  {
    name: '📚 Livro',
    type: 'felicidade',
    price: 20,
    effect: { happiness: 25, energy: -10, life: 5 },
  },
  {
    name: '🎵 Música',
    type: 'felicidade',
    price: 15,
    effect: { happiness: 30, energy: 5 },
  },
  {
    name: '🌺 Flor',
    type: 'felicidade',
    price: 10,
    effect: { happiness: 25, life: 3 },
  },
  {
    name: '💎 Joia',
    type: 'felicidade',
    price: 50,
    effect: { happiness: 60, life: 10 },
  },

  // ==================== ESPECIAIS ====================
  {
    name: '✨ Poção Mágica',
    type: 'especial',
    price: 100,
    effect: { hunger: 50, energy: 50, happiness: 50, hygiene: 50, life: 50 },
  },
  {
    name: '🔮 Oráculo',
    type: 'especial',
    price: 75,
    effect: { life: 30, happiness: 30, energy: 20 },
  },
  {
    name: '🎰 Bilhete de Lotaria',
    type: 'especial',
    price: 5,
    effect: { happiness: 10 },
  },
  {
    name: '👑 Coroa Real',
    type: 'especial',
    price: 200,
    effect: { happiness: 100, life: 20, hygiene: 30 },
  },
  {
    name: '🚀 Foguetão',
    type: 'especial',
    price: 150,
    effect: { happiness: 80, energy: 50, life: 15 },
  },
];

async function main() {
  console.log('📦 A importar itens para a loja...');

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const item of items) {
    try {
      // Verificar se item já existe
      const existing = await prisma.item.findFirst({
        where: { name: item.name },
      });

      if (existing) {
        // Atualizar item existente
        await prisma.item.update({
          where: { id: existing.id },
          data: {
            type: item.type,
            price: item.price,
            effect: item.effect,
          },
        });
        console.log(`✏️  Atualizado: ${item.name}`);
        updated++;
      } else {
        // Criar novo item
        await prisma.item.create({
          data: {
            name: item.name,
            type: item.type,
            price: item.price,
            effect: item.effect,
          },
        });
        console.log(`✅ Criado: ${item.name}`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Erro ao importar ${item.name}:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Resumo:');
  console.log(`   ✅ Criados: ${created}`);
  console.log(`   ✏️  Atualizados: ${updated}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📦 Total: ${items.length}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
