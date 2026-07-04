const express = require('express');
const router = express.Router();

const controller = require('../controllers/reuniones.controller');
const verificarToken = require('../middleware/verificarToken');
const verificarAdmin = require('../middleware/verificarAdmin');

router.get(
    '/',
    verificarToken,
    controller.obtenerReuniones
);

router.post(
    '/',
    verificarToken,
    verificarAdmin,
    controller.crearReunion
);

router.put(
    '/:id/cancelar',
    verificarToken,
    verificarAdmin,
    controller.cancelarReunion
);

router.get(
    '/:id',
    verificarToken,
    controller.obtenerReunionPorId
);

module.exports = router;
