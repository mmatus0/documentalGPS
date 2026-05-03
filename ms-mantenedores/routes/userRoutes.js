const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const userController = require('../controllers/userController');

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.' }
});

router.post('/',               userLimiter, userController.createUser);
router.get('/',                userLimiter, userController.getUsers);
router.put('/:id',             userLimiter, userController.updateUser);
router.delete('/:id',          userLimiter, userController.deleteUser);
router.patch('/:id/reactivar', userLimiter, userController.reactivarUser);

module.exports = router;