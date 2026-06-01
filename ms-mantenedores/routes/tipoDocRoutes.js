const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const ctrl      = require('../controllers/tipoDocController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' },
});

router.get('/',                limiter, ctrl.getTiposDocumento);
router.post('/',               limiter, ctrl.crearTipoDocumento);
router.put('/:id',             limiter, ctrl.editarTipoDocumento);
router.delete('/:id',          limiter, ctrl.desactivarTipoDocumento);
router.patch('/:id/reactivar', limiter, ctrl.reactivarTipoDocumento);

module.exports = router;