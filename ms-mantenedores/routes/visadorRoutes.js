const express      = require('express');
const rateLimit    = require('express-rate-limit');
const router       = express.Router();
const visadorCtrl  = require('../controllers/visadorController');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });

router.get('/',     limiter, visadorCtrl.getVisadores);
router.get('/:id',  limiter, visadorCtrl.getVisadorById);
router.post('/',    limiter, visadorCtrl.crearVisador);
router.put('/:id',  limiter, visadorCtrl.editarVisador);
router.delete('/:id', limiter, visadorCtrl.desactivarVisador);

module.exports = router;