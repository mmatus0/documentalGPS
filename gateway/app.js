require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verificarToken, soloAdmin } = require('./middleware/authMiddleware');

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

// Helper para crear proxy hacia ms-mantenedores
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

// Eje 1 — Usuarios (solo Admin)
app.use('/api/users', apiLimiter, verificarToken, soloAdmin, msProxy('/api/users'));

// Eje 2 — Mantenedores de escritura (solo Admin)
app.use('/api/contratistas', apiLimiter, verificarToken, soloAdmin, msProxy('/api/contratistas'));
app.use('/api/proyectos',    apiLimiter, verificarToken, soloAdmin, msProxy('/api/proyectos'));

// Categorías, tipos-doc y tipos-colab: escritura solo Admin, pero lectura
// necesaria para Colaboradores al crear expedientes (HU-15).
// El control de escritura queda en los controladores del ms-mantenedores.
app.use('/api/categorias',  apiLimiter, verificarToken, msProxy('/api/categorias'));
app.use('/api/tipos-doc',   apiLimiter, verificarToken, msProxy('/api/tipos-doc'));
app.use('/api/tipos-colab', apiLimiter, verificarToken, msProxy('/api/tipos-colab'));

// Áreas: escritura solo Admin, pero GET /mis-unidades accesible a todos los roles
app.use('/api/areas/mis-unidades', apiLimiter, verificarToken, msProxy('/api/areas'));
app.use('/api/areas',              apiLimiter, verificarToken, soloAdmin, msProxy('/api/areas'));

// Eje 3 — Procesos y etapas (solo Admin)
app.use('/api/procesos', apiLimiter, verificarToken, soloAdmin, msProxy('/api/procesos'));
app.use('/api/etapas',   apiLimiter, verificarToken, soloAdmin, msProxy('/api/etapas'));

// Eje 4 — Expedientes y documentos (todos los roles autenticados)
app.use('/api/expedientes', apiLimiter, verificarToken, msProxy('/api/expedientes'));

module.exports = app;