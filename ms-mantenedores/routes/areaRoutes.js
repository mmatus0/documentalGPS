const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router({ mergeParams: true });

const areaCRUD   = require('../controllers/areaController');
const areaUsuario = require('../controllers/areaUsuarioController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/',               limiter, areaCRUD.getAreas);
router.post('/',              limiter, areaCRUD.crearArea);
router.put('/:id',            limiter, areaCRUD.editarArea);
router.delete('/:id',         limiter, areaCRUD.desactivarArea);
router.patch('/:id/reactivar',limiter, areaCRUD.reactivarArea);

router.get('/:areaId/usuarios',              limiter, areaUsuario.getUsuariosPorArea);
router.get('/:areaId/usuarios-disponibles',  limiter, areaUsuario.getUsuariosDisponibles);
router.post('/:areaId/usuarios',             limiter, areaUsuario.asignarUsuario);
router.delete('/:areaId/usuarios/:asignacionId', limiter, areaUsuario.removerUsuario);

module.exports = router;