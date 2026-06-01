const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const ctrl      = require('../controllers/procesoController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' },
});

router.get('/',                limiter, ctrl.getProcesos);
router.post('/',               limiter, ctrl.crearProceso);
router.put('/:id',             limiter, ctrl.editarProceso);
router.delete('/:id',          limiter, ctrl.desactivarProceso);
router.patch('/:id/reactivar', limiter, ctrl.reactivarProceso);

module.exports = router;