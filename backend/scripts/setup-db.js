/**
 * Script para configurar o banco de dados automaticamente
 * Requer que o PostgreSQL esteja rodando e acessível
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão com banco de dados estabelecida!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.log('\n📋 Verifique:');
    console.log('1. PostgreSQL está rodando?');
    console.log('2. DATABASE_URL no .env está correto?');
    console.log('3. Banco de dados e usuário existem?');
    return false;
  }
}

async function checkTables() {
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✅ Tabelas já existem!');
    return true;
  } catch (error) {
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('⚠️  Tabelas não existem. Execute: npm run prisma:migrate');
      return false;
    }
    throw error;
  }
}

async function createAdminUser() {
  const createAdmin = await question('\n📝 Criar usuário admin? (s/n): ');
  
  if (createAdmin.toLowerCase() !== 's') {
    return;
  }

  const username = await question('Usuário admin: ') || 'admin';
  const password = await question('Senha admin: ') || 'admin123';

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
        deviceLimit: 1,
      },
    });

    console.log('\n✅ Usuário admin criado com sucesso!');
    console.log(`   Usuário: ${username}`);
    console.log(`   Senha: ${password}`);
    console.log('\n⚠️  IMPORTANTE: Anote estas credenciais!');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Usuário já existe!');
    } else {
      console.error('❌ Erro ao criar usuário:', error.message);
    }
  }
}

async function main() {
  console.log('🔧 Verificando configuração do banco de dados...\n');

  const connected = await testConnection();
  if (!connected) {
    console.log('\n💡 Dica: Consulte SOLUCAO_ERRO_BANCO.md para ajuda');
    process.exit(1);
  }

  const tablesExist = await checkTables();
  if (!tablesExist) {
    console.log('\n💡 Execute: npm run prisma:migrate');
    await prisma.$disconnect();
    process.exit(0);
  }

  await createAdminUser();

  await prisma.$disconnect();
  rl.close();
  console.log('\n✅ Setup concluído!');
}

main().catch(error => {
  console.error('Erro:', error);
  process.exit(1);
});

