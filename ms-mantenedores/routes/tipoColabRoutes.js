const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const ctrl      = require('../controllers/tipoColabController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' },
});

router.get('/',                limiter, ctrl.getTiposColab);
router.post('/',               limiter, ctrl.crearTipoColab);
router.put('/:id',             limiter, ctrl.editarTipoColab);
router.delete('/:id',          limiter, ctrl.desactivarTipoColab);
router.patch('/:id/reactivar', limiter, ctrl.reactivarTipoColab);

module.exports = router;