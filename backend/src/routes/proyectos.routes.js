const express = require('express');
const router = express.Router();

const controller = require('../controllers/proyectos.controller');
const verificarToken = require('../middleware/verificarToken');

router.get(
    '/',
    verificarToken,
    controller.obtenerProyectos
);

router.post(
    '/',
    verificarToken,
    controller.crearProyecto
);

router.get(
    '/:id/timeline',
    verificarToken,
    controller.obtenerTimelineProyecto
);

router.put(
    '/:id',
    verificarToken,
    controller.actualizarProyecto
);

router.delete(
    '/:id',
    verificarToken,
    controller.eliminarProyecto
);

router.get(
    '/:id',
    verificarToken,
    controller.obtenerProyectoPorId
);

module.exports = router;
