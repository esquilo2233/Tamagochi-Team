const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPet() {
  try {
    console.log('Verificando pet com ID 1...');
    
    const pet = await prisma.pet.findUnique({
      where: { id: 1 }
    });
    
    console.log('Pet encontrado:');
    console.log(JSON.stringify(pet, null, 2));
    
    if (pet && pet.appearance && pet.appearance.startsWith('/')) {
      console.log('✓ Pet tem uma imagem carregada:', pet.appearance);
    } else {
      console.log('✗ Pet não tem imagem ou imagem inválida');
      
      // Verificar se há imagens disponíveis na pasta avatars
      const fs = require('fs');
      const path = require('path');
      const avatarsDir = path.join(__dirname, '../public/avatars');
      
      if (fs.existsSync(avatarsDir)) {
        const files = fs.readdirSync(avatarsDir);
        console.log('Imagens disponíveis em public/avatars:', files);
        
        if (files.length > 0) {
          const latestImage = '/avatars/' + files[files.length - 1];
          console.log('Atualizando pet para usar a imagem:', latestImage);
          
          await prisma.pet.update({
            where: { id: 1 },
            data: { appearance: latestImage }
          });
          
          console.log('✓ Pet atualizado com sucesso!');
        }
      }
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPet();