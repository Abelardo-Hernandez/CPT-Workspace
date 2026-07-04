const express = require('express');
const router = express.Router();

const controller = require('../controllers/acciones.controller');
const verificarToken = require('../middleware/verificarToken');

router.get(
    '/',
    verificarToken,
    controller.obtenerAcciones
);

router.post(
    '/',
    verificarToken,
    controller.crearAccion
);

router.put(
    '/:id',
    verificarToken,
    controller.actualizarAccion
);

router.put(
    '/:id/estatus',
    verificarToken,
    controller.actualizarEstatusAccion
);

router.delete(
    '/:id',
    verificarToken,
    controller.eliminarAccion
);

router.get(
    '/reunion/:reunionId',
    verificarToken,
    controller.obtenerAccionesPorReunion
);

router.get(
    '/proyecto/:proyectoId',
    verificarToken,
    controller.obtenerAccionesPorProyecto
);

module.exports = router;
