const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Todas as rotas requerem autenticação e admin
router.use(authenticateToken);
router.use(isAdmin);

// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        active: true,
        expirationDate: true,
        deviceLimit: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        loginLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});

// Criar novo usuário
router.post('/', [
  body('username').notEmpty().withMessage('Usuário é obrigatório'),
  body('password').notEmpty().withMessage('Senha é obrigatória').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('expirationType').optional().isIn(['days', 'date', 'hours', 'none']).withMessage('Tipo de expiração inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, expirationType, expirationValue, deviceLimit, role } = req.body;

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    // Senha é obrigatória agora
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Senha é obrigatória e deve ter no mínimo 6 caracteres' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calcular data de expiração
    let expirationDate = null;
    if (expirationType && expirationType !== 'none') {
      if (expirationType === 'days' && expirationValue) {
        expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + parseInt(expirationValue));
      } else if (expirationType === 'hours' && expirationValue) {
        expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + parseInt(expirationValue));
      } else if (expirationType === 'date' && expirationValue) {
        expirationDate = new Date(expirationValue);
      }
    }

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        expirationDate,
        deviceLimit: deviceLimit || 1,
        role: role || 'USER',
        active: true,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      ...userWithoutPassword,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { username, password, expirationDate, active, deviceLimit, role } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (expirationDate !== undefined) updateData.expirationDate = expirationDate ? new Date(expirationDate) : null;
    if (active !== undefined) updateData.active = active;
    if (deviceLimit !== undefined) updateData.deviceLimit = deviceLimit;
    if (role) updateData.role = role;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Erro ao deletar usuário' });
  }
});

// Renovar expiração
router.post('/:id/renew', [
  body('expirationType').isIn(['days', 'date', 'hours']).withMessage('Tipo de expiração inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { expirationType, expirationValue } = req.body;

    let expirationDate = null;
    if (expirationType === 'days' && expirationValue) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expirationValue));
    } else if (expirationType === 'hours' && expirationValue) {
      expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + parseInt(expirationValue));
    } else if (expirationType === 'date' && expirationValue) {
      expirationDate = new Date(expirationValue);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { expirationDate },
    });

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error renewing user:', error);
    res.status(500).json({ message: 'Erro ao renovar expiração' });
  }
});

module.exports = router;

