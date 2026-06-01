const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const ctrl      = require('../controllers/etapaController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' },
});

router.get('/',     limiter, ctrl.getEtapas);
router.post('/',    limiter, ctrl.crearEtapa);
router.put('/:id',  limiter, ctrl.editarEtapa);
router.delete('/:id', limiter, ctrl.eliminarEtapa);

module.exports = router;