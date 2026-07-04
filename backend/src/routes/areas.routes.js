const express = require('express');

const router = express.Router();

const controller =
require('../controllers/areas.controller');

const verificarToken =
require('../middleware/verificarToken');

const verificarAdmin =
require('../middleware/verificarAdmin');

router.get(
    '/',
    verificarToken,
    controller.obtenerAreas
);

router.post(
    '/',
    verificarToken,
    verificarAdmin,
    controller.crearArea
);

router.delete(
    '/:id',
    verificarToken,
    verificarAdmin,
    controller.eliminarArea
);

module.exports = router;
