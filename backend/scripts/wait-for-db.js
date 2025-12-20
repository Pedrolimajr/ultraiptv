// Script para aguardar o banco de dados estar pronto
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function waitForDatabase(maxAttempts = 30, delay = 2000) {
  console.log('🔄 Aguardando banco de dados estar pronto...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Banco de dados conectado!');
      await prisma.$disconnect();
      return true;
    } catch (error) {
      console.log(`⏳ Tentativa ${i + 1}/${maxAttempts}: ${error.message}`);
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ Não foi possível conectar ao banco de dados após', maxAttempts, 'tentativas');
  await prisma.$disconnect();
  return false;
}

waitForDatabase().then(success => {
  process.exit(success ? 0 : 1);
});

