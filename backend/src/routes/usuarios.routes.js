const express = require('express');

const router = express.Router();

const usuariosController =
require('../controllers/usuarios.controller');

const verificarToken =
require('../middleware/verificarToken');

const verificarAdmin =
require('../middleware/verificarAdmin');

router.get(
    '/',
    verificarToken,
    usuariosController.obtenerUsuarios
);

router.post(
    '/',
    verificarToken,
    verificarAdmin,
    usuariosController.crearUsuario
);

router.put(
    '/:id',
    verificarToken,
    verificarAdmin,
    usuariosController.actualizarUsuario
);

router.delete(
    '/:id',
    verificarToken,
    verificarAdmin,
    usuariosController.eliminarUsuario
);

module.exports = router;
