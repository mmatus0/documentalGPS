const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/areaUsuarioController');

router.get('/',              ctrl.getAreas);
router.get('/:areaId/usuarios',              ctrl.getUsuariosPorArea);
router.get('/:areaId/usuarios-disponibles',  ctrl.getUsuariosDisponibles);
router.post('/:areaId/usuarios',             ctrl.asignarUsuario);
router.delete('/:areaId/usuarios/:asignacionId', ctrl.removerUsuario);

module.exports = router;