require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verificarToken, soloAdmin } = require('./middleware/authMiddleware');

const app = express();
app.use(cors());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta nuevamente en 15 minutos.' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 1000,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' }
});

const msProxy = (apiPrefix) => createProxyMiddleware({
  target: 'http://ms-mantenedores:3002',
  changeOrigin: true,
  pathRewrite: (path) => `${apiPrefix}${path}`,
  // La carga masiva de documentos puede tardar varios minutos; sin esto el proxy
  // corta la conexión con ms-mantenedores mucho antes de que termine.
  proxyTimeout: 10 * 60 * 1000,
  timeout: 10 * 60 * 1000,
});

// Rutas publicas
app.use('/api/auth', authLimiter, createProxyMiddleware({
  target: 'http://ms-auth:3001',
  changeOrigin: true,
  pathRewrite: (path) => `/api/auth${path}`,
}));

// Rutas protegidas solo admin
app.use('/api/users',        apiLimiter, verificarToken, soloAdmin, msProxy('/api/users'));
app.use('/api/contratistas', apiLimiter, verificarToken, soloAdmin, msProxy('/api/contratistas'));
app.use('/api/proyectos',    apiLimiter, verificarToken, soloAdmin, msProxy('/api/proyectos'));

// Categorias, tipos-doc y tipos-colab: todos los roles autenticados
app.use('/api/categorias',  apiLimiter, verificarToken, msProxy('/api/categorias'));
app.use('/api/tipos-doc',   apiLimiter, verificarToken, msProxy('/api/tipos-doc'));
app.use('/api/tipos-colab', apiLimiter, verificarToken, msProxy('/api/tipos-colab'));

// Areas: mis-unidades y /:id/usuarios accesibles a todos los roles
app.use('/api/areas/mis-unidades', apiLimiter, verificarToken, msProxy('/api/areas/mis-unidades'));
app.use('/api/areas', apiLimiter, verificarToken, (req, res, next) => {
  const esGETUsuarios = req.method === 'GET' && /^\/[0-9]+\/usuarios/.test(req.path);
  const esGETListado  = req.method === 'GET' && req.path === '/';
  if (esGETUsuarios || esGETListado) return next();
  return soloAdmin(req, res, next);
}, msProxy('/api/areas'));

// Procesos y etapas: solo admin
app.use('/api/procesos', apiLimiter, verificarToken, soloAdmin, msProxy('/api/procesos'));
app.use('/api/etapas',   apiLimiter, verificarToken, soloAdmin, msProxy('/api/etapas'));

// Expedientes: todos los roles autenticados
app.use('/api/expedientes', apiLimiter, verificarToken, msProxy('/api/expedientes'));

// Tareas: todos los roles autenticados (el controller filtra por rol)
app.use('/api/tareas', apiLimiter, verificarToken, msProxy('/api/tareas'));

// Visadores: solo admin para escritura, todos para lectura (el controller lo maneja internamente)
app.use('/api/visadores', apiLimiter, verificarToken, msProxy('/api/visadores'));

module.exports = app;