const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Usuário é obrigatório'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Usuário bloqueado' });
    }

    // Verificar expiração
    if (user.expirationDate && new Date(user.expirationDate) < new Date()) {
      return res.status(403).json({ 
        message: 'Conta expirada',
        expired: true,
        expirationDate: user.expirationDate,
      });
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Registrar log de login
    await prisma.loginLog.create({
      data: {
        userId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'Unknown',
        success: true,
      },
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        expirationDate: user.expirationDate,
        deviceLimit: user.deviceLimit,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ valid: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true,
        active: true,
        expirationDate: true,
      },
    });

    if (!user || !user.active) {
      return res.status(401).json({ valid: false });
    }

    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;

