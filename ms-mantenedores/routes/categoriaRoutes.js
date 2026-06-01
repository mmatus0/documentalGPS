const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const ctrl      = require('../controllers/categoriaController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' },
});

// ── Categorías ──────────────────────────────────────────────────────────────
router.get('/',                limiter, ctrl.getCategorias);
router.post('/',               limiter, ctrl.crearCategoria);
router.put('/:id',             limiter, ctrl.editarCategoria);
router.delete('/:id',          limiter, ctrl.desactivarCategoria);
router.patch('/:id/reactivar', limiter, ctrl.reactivarCategoria);

// ── Subtipos (anidados bajo una categoría) ──────────────────────────────────
router.get('/:categoriaId/subtipos',                       limiter, ctrl.getSubtiposPorCategoria);
router.post('/:categoriaId/subtipos',                      limiter, ctrl.crearSubtipo);
router.put('/:categoriaId/subtipos/:subtipoId',            limiter, ctrl.editarSubtipo);
router.delete('/:categoriaId/subtipos/:subtipoId',         limiter, ctrl.desactivarSubtipo);
router.patch('/:categoriaId/subtipos/:subtipoId/reactivar',limiter, ctrl.reactivarSubtipo);

module.exports = router;