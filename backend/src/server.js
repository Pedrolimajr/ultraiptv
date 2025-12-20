require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const os = require('os');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const logRoutes = require('./routes/logs');
const dashboardRoutes = require('./routes/dashboard');
const contentRoutes = require('./routes/content');
const diagnosticRoutes = require('./routes/diagnostic');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-IPTV-Base-URL',
    'X-IPTV-Username',
    'X-IPTV-Password',
    'X-IPTV-Profile',
    'X-IPTV-Portal',
    // lowercase variants to match typical browser preflight behavior
    'x-iptv-base-url',
    'x-iptv-username',
    'x-iptv-password',
    'x-iptv-profile',
    'x-iptv-portal',
  ],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/diagnostic', diagnosticRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Bind explicitly to 0.0.0.0 so the server is reachable from the local network
app.listen(PORT, '0.0.0.0', () => {
  // Collect non-internal IPv4 addresses for quick testing
  const interfaces = os.networkInterfaces();
  const addresses = [];
  Object.keys(interfaces).forEach((name) => {
    interfaces[name].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) addresses.push(iface.address);
    });
  });

  console.log(`🚀 Server running on port ${PORT}`);
  if (addresses.length > 0) {
    console.log(`📡 Accessible at: ${addresses.map(a => `http://${a}:${PORT}`).join(', ')}`);
  }
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

