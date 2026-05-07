require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verificarToken } = require('./middleware/authMiddleware');

const app = express();
app.use(cors());

// ── Rate limiters ──────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta nuevamente en 15 minutos.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' }
});

// ── Rutas públicas (sin token) ─────────────────────────────────────────────
app.use('/api/auth', authLimiter, createProxyMiddleware({
  target: 'http://ms-auth:3001',
  changeOrigin: true,
  pathRewrite: (path) => '/api/auth' + path
}));

// ── Rutas protegidas (requieren token válido) ──────────────────────────────
app.use('/api/users', apiLimiter, verificarToken, createProxyMiddleware({
  target: 'http://ms-mantenedores:3002',
  changeOrigin: true,
  pathRewrite: (path) => '/api/users' + path
}));

app.use('/api/contratistas', apiLimiter, verificarToken, createProxyMiddleware({
  target: 'http://ms-mantenedores:3002',
  changeOrigin: true,
  pathRewrite: (path) => '/api/contratistas' + path
}));

app.use('/api/areas', apiLimiter, verificarToken, createProxyMiddleware({
  target: 'http://ms-mantenedores:3002',
  changeOrigin: true,
  pathRewrite: (path) => '/api/areas' + path
}));

module.exports = app;