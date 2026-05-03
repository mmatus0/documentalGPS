const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/contratistaController');

router.get('/',                ctrl.getContratistas);
router.post('/',               ctrl.crearContratista);
router.put('/:id',             ctrl.editarContratista);
router.delete('/:id',          ctrl.desactivarContratista);
router.patch('/:id/reactivar', ctrl.reactivarContratista);
 
module.exports = router;
