const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const ctrl       = require('../controllers/contratistaController');
 
const contratistaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' }
});
 
router.get('/',                contratistaLimiter, ctrl.getContratistas);
router.post('/',               contratistaLimiter, ctrl.crearContratista);
router.put('/:id',             contratistaLimiter, ctrl.editarContratista);
router.delete('/:id',          contratistaLimiter, ctrl.desactivarContratista);
router.patch('/:id/reactivar', contratistaLimiter, ctrl.reactivarContratista);
 
module.exports = router;
