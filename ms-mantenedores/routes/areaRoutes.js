const express = require('express');
const router = express.Router({ mergeParams: true });

const areaCRUD = require('../controllers/areaController');
const areaUsuario = require('../controllers/areaUsuarioController');

router.get('/',                        areaCRUD.getAreas);
router.post('/',                       areaCRUD.crearArea);
router.put('/:id',                     areaCRUD.editarArea);
router.delete('/:id',                  areaCRUD.desactivarArea);
router.patch('/:id/reactivar',         areaCRUD.reactivarArea);

router.get('/:areaId/usuarios',                  areaUsuario.getUsuariosPorArea);
router.get('/:areaId/usuarios-disponibles',      areaUsuario.getUsuariosDisponibles);
router.post('/:areaId/usuarios',                 areaUsuario.asignarUsuario);
router.delete('/:areaId/usuarios/:asignacionId', areaUsuario.removerUsuario);


module.exports = router;