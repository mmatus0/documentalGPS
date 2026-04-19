const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {verificarToken, soloAdmin} = require('../middleware/authMiddleware');

router.post('/', userController.createUser);
router.get('/', userController.getUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/reactivar', vertificarToken, soloAdmin, userController.reactivarUser);

module.exports = router;