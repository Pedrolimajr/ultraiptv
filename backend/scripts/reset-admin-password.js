/**
 * Script para resetar senha do admin
 * Uso: node scripts/reset-admin-password.js
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
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function resetAdminPassword() {
  try {
    console.log('\n🔧 Resetar senha do administrador...\n');

    // Listar admins existentes
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        username: true,
        active: true,
      },
    });

    if (admins.length === 0) {
      console.log('❌ Nenhum usuário admin encontrado!');
      console.log('Execute: npm run create:admin');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    console.log('Usuários admin encontrados:');
    admins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.username} (${admin.active ? 'Ativo' : 'Inativo'})`);
    });

    const choice = await question('\nEscolha o número do usuário (ou Enter para o primeiro): ');
    const selectedIndex = choice ? parseInt(choice) - 1 : 0;

    if (selectedIndex < 0 || selectedIndex >= admins.length) {
      console.log('❌ Opção inválida!');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    const selectedAdmin = admins[selectedIndex];
    console.log(`\nResetando senha para: ${selectedAdmin.username}`);

    const newPassword = await question('Nova senha (mínimo 6 caracteres): ');

    if (!newPassword || newPassword.length < 6) {
      console.log('❌ Senha deve ter no mínimo 6 caracteres!');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: selectedAdmin.id },
      data: {
        password: hashedPassword,
        active: true,
        role: 'ADMIN',
      },
    });

    console.log('\n✅ Senha resetada com sucesso!');
    console.log(`\n📋 Credenciais:`);
    console.log(`   Usuário: ${updatedUser.username}`);
    console.log(`   Senha: ${newPassword}`);
    console.log(`\n⚠️  IMPORTANTE: Anote estas credenciais!`);
    console.log(`\n🚀 Agora você pode fazer login no painel admin:`);
    console.log(`   http://localhost:5173`);

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

resetAdminPassword();

