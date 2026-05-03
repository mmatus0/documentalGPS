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
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                   // máximo 20 intentos de login por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta nuevamente en 15 minutos.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                  // máximo 100 requests por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' }
});

// ── Rutas públicas (sin token) ─────────────────────────────────────────────
app.use('/api/auth', authLimiter, createProxyMiddleware({
  target: 'http://ms-auth:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' }
}));

// ── Rutas protegidas (requieren token válido) ──────────────────────────────
app.use('/api/users',        apiLimiter, verificarToken, createProxyMiddleware({ target: 'http://ms-mantenedores:3002', changeOrigin: true }));
app.use('/api/contratistas', apiLimiter, verificarToken, createProxyMiddleware({ target: 'http://ms-mantenedores:3002', changeOrigin: true }));
app.use('/api/areas',        apiLimiter, verificarToken, createProxyMiddleware({ target: 'http://ms-mantenedores:3002', changeOrigin: true }));

module.exports = app;