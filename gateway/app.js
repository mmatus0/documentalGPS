require('dotenv').config();
 
const express = require('express');
const cors    = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verificarToken } = require('./middleware/authMiddleware');
 
const app = express();
app.use(cors());
app.use(express.json());
 
// ── Rutas públicas (sin token) ─────────────────────────────────────────────
app.use('/api/auth', createProxyMiddleware({
  target: 'http://ms-auth:3001',
  changeOrigin: true
}));
 
// ── Rutas protegidas (requieren token válido) ──────────────────────────────
app.use('/api/users',        verificarToken, createProxyMiddleware({ target: 'http://ms-mantenedores:3002', changeOrigin: true }));
app.use('/api/contratistas', verificarToken, createProxyMiddleware({ target: 'http://ms-mantenedores:3002', changeOrigin: true }));
app.use('/api/areas',        verificarToken, createProxyMiddleware({ target: 'http://ms-mantenedores:3002', changeOrigin: true }));
 
module.exports = app;
