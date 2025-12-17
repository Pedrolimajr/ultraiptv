#!/usr/bin/env node
/**
 * Criar admin não-interativo via variáveis de ambiente
 * Uso: ADMIN_USERNAME=... ADMIN_PASSWORD=... node scripts/create-admin-noninteractive.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error('ERROR: set ADMIN_USERNAME and ADMIN_PASSWORD env vars');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('ERROR: password must have at least 6 characters');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
      },
      create: {
        username,
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
        deviceLimit: 1,
      },
    });

    console.log('✅ Admin criado/atualizado com sucesso:');
    console.log(`   Usuário: ${user.username}`);
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
