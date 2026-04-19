const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/contratistaController');
const { verificarToken, soloAdmin } = require('../middleware/authMiddleware');

router.get('/',                verificarToken, soloAdmin, ctrl.getContratistas);
router.post('/',               verificarToken, soloAdmin, ctrl.crearContratista);
router.put('/:id',             verificarToken, soloAdmin, ctrl.editarContratista);
router.delete('/:id',          verificarToken, soloAdmin, ctrl.desactivarContratista);
router.patch('/:id/reactivar', verificarToken, soloAdmin, ctrl.reactivarContratista);

module.exports = router;