require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verificarToken } = require('./middleware/authMiddleware');

const app = express();
app.use(cors());

// ── Rate limiters ──────────────────────────────────────────────────────────────
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

// Helper para crear proxy hacia ms-mantenedores (evita repetición)
const msProxy = (prefix) => createProxyMiddleware({
  target: 'http://ms-mantenedores:3002',
  changeOrigin: true,
  pathRewrite: { '^': prefix },
});

// ── Rutas públicas (sin token) ─────────────────────────────────────────────────
app.use('/api/auth', authLimiter, createProxyMiddleware({
  target: 'http://ms-auth:3001',
  changeOrigin: true,
  pathRewrite: { '^': '/api/auth' },
}));

// ── Rutas protegidas (requieren token válido) ──────────────────────────────────

// Eje 1 — Usuarios
app.use('/api/users', apiLimiter, verificarToken, msProxy('/api/users'));

// Eje 2 — Mantenedores base
app.use('/api/contratistas', apiLimiter, verificarToken, msProxy('/api/contratistas'));
app.use('/api/areas',        apiLimiter, verificarToken, msProxy('/api/areas'));
app.use('/api/categorias',   apiLimiter, verificarToken, msProxy('/api/categorias'));   // HU-08
app.use('/api/tipos-doc',    apiLimiter, verificarToken, msProxy('/api/tipos-doc'));    // HU-09
app.use('/api/tipos-colab',  apiLimiter, verificarToken, msProxy('/api/tipos-colab')); // HU-12

// Eje 3 — Procesos y etapas
app.use('/api/procesos', apiLimiter, verificarToken, msProxy('/api/procesos')); // HU-10
app.use('/api/etapas',   apiLimiter, verificarToken, msProxy('/api/etapas'));   // HU-11

// Eje 4 — Expedientes y documentos adjuntos
app.use('/api/expedientes', apiLimiter, verificarToken, msProxy('/api/expedientes'));

module.exports = app;