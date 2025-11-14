const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(isAdmin);

// Listar logs de login
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 100, offset = 0 } = req.query;

    const where = userId ? { userId: parseInt(userId) } : {};

    const logs = await prisma.loginLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.loginLog.count({ where });

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Erro ao buscar logs' });
  }
});

module.exports = router;

