/**
 * Script para criar usuário admin
 * Uso: node scripts/create-admin.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n🔧 Criando usuário administrador...\n');

    // Verificar se já existe admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('⚠️  Já existe um usuário admin:');
      console.log(`   Usuário: ${existingAdmin.username}`);
      console.log(`   Ativo: ${existingAdmin.active ? 'Sim' : 'Não'}`);
      
      const overwrite = await question('\nDeseja criar um novo admin? (s/n): ');
      if (overwrite.toLowerCase() !== 's') {
        console.log('Operação cancelada.');
        rl.close();
        await prisma.$disconnect();
        return;
      }
    }

    // Solicitar dados
    const username = await question('Usuário admin: ') || 'admin';
    const password = await question('Senha: ');

    if (!password || password.length < 6) {
      console.log('❌ Senha deve ter no mínimo 6 caracteres!');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar ou atualizar usuário
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
        deviceLimit: 1,
      },
      create: {
        username,
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
        deviceLimit: 1,
      },
    });

    console.log('\n✅ Usuário admin criado com sucesso!');
    console.log(`\n📋 Credenciais:`);
    console.log(`   Usuário: ${user.username}`);
    console.log(`   Senha: ${password}`);
    console.log(`   Role: ${user.role}`);
    console.log(`\n⚠️  IMPORTANTE: Anote estas credenciais!`);
    console.log(`\n🚀 Agora você pode fazer login no painel admin:`);
    console.log(`   http://localhost:5173`);

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Erro: Usuário já existe!');
    } else {
      console.error('❌ Erro ao criar usuário:', error.message);
    }
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();

