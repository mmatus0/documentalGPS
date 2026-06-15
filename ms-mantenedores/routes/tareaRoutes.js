const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const tareaCtrl = require('../controllers/tareaController');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });

// HU-22 / HU-23: listado (admin=todas, colaborador=suyas)
router.get('/',                            limiter, tareaCtrl.getTareas);
// Detalle de una tarea (con historial y documentos adjuntos)
router.get('/:id',                         limiter, tareaCtrl.getTareaDetalle);
// Abrir tarea (marcar En Progreso)
router.patch('/:id/abrir',                 limiter, tareaCtrl.abrirTarea);
// HU-24: Revisión
router.post('/:id/aceptar',               limiter, tareaCtrl.aceptarRevision);
router.post('/:id/rechazar',              limiter, tareaCtrl.rechazarRevision);
// HU-25: Aprobación
router.post('/:id/aprobar',               limiter, tareaCtrl.aprobarAprobacion);
router.post('/:id/rechazar-aprobacion',   limiter, tareaCtrl.rechazarAprobacion);
// HU-26: Colaboración
router.post('/:id/solicitar-colaboracion', limiter, tareaCtrl.solicitarColaboracion);
router.post('/:id/cerrar-colaboracion',    limiter, tareaCtrl.cerrarColaboracion);

module.exports = router;