const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const ctrl      = require('../controllers/proyectoController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' },
});

// ── Proyectos ────────────────────────────────────────────────────────────────
router.get('/',                limiter, ctrl.getProyectos);
router.post('/',               limiter, ctrl.crearProyecto);
router.put('/:id',             limiter, ctrl.editarProyecto);
router.delete('/:id',          limiter, ctrl.desactivarProyecto);
router.patch('/:id/reactivar', limiter, ctrl.reactivarProyecto);

// ── Áreas asociadas (anidadas bajo un proyecto) ───────────────────────────────
router.get('/:proyectoId/areas',                          limiter, ctrl.getAreasPorProyecto);
router.get('/:proyectoId/areas-disponibles',              limiter, ctrl.getAreasDisponibles);
router.post('/:proyectoId/areas',                         limiter, ctrl.asociarArea);
router.delete('/:proyectoId/areas/:asociacionId',         limiter, ctrl.desasociarArea);

module.exports = router;