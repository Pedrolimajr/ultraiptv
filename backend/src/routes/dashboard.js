const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(isAdmin);

// Estatísticas do dashboard
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        active: true,
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } },
        ],
      },
    });
    const expiredUsers = await prisma.user.count({
      where: {
        expirationDate: { lt: new Date() },
      },
    });
    const blockedUsers = await prisma.user.count({
      where: { active: false },
    });

    // Últimas 24 horas
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const activeConnections = await prisma.loginLog.count({
      where: {
        success: true,
        createdAt: { gte: last24Hours },
      },
    });

    res.json({
      totalUsers,
      activeUsers,
      expiredUsers,
      blockedUsers,
      activeConnections,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;

