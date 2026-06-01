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
const { soloAdmin } = require('./middleware/authMiddleware');

// Eje 1 — Usuarios (solo Admin puede gestionar usuarios)
app.use('/api/users', apiLimiter, verificarToken, soloAdmin, msProxy('/api/users'));

// Eje 2 — Mantenedores base (solo Admin)
app.use('/api/contratistas', apiLimiter, verificarToken, soloAdmin, msProxy('/api/contratistas'));
app.use('/api/categorias',   apiLimiter, verificarToken, soloAdmin, msProxy('/api/categorias'));
app.use('/api/tipos-doc',    apiLimiter, verificarToken, soloAdmin, msProxy('/api/tipos-doc'));
app.use('/api/tipos-colab',  apiLimiter, verificarToken, soloAdmin, msProxy('/api/tipos-colab'));
app.use('/api/proyectos',    apiLimiter, verificarToken, soloAdmin, msProxy('/api/proyectos'));

// Áreas: escritura solo Admin, pero GET /mis-unidades accesible a todos los roles
// Se divide en dos rutas para que los Colaboradores/Lectores puedan ver sus unidades
app.use('/api/areas/mis-unidades', apiLimiter, verificarToken, msProxy('/api/areas'));
app.use('/api/areas',              apiLimiter, verificarToken, soloAdmin, msProxy('/api/areas'));

// Eje 3 — Procesos y etapas (solo Admin)
app.use('/api/procesos', apiLimiter, verificarToken, soloAdmin, msProxy('/api/procesos'));
app.use('/api/etapas',   apiLimiter, verificarToken, soloAdmin, msProxy('/api/etapas'));

// Eje 4 — Expedientes y documentos (todos los roles autenticados)
app.use('/api/expedientes', apiLimiter, verificarToken, msProxy('/api/expedientes'));
module.exports = app;