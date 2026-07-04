const express = require('express');
const router = express.Router();

const controller = require('../controllers/seguimiento.controller');
const verificarToken = require('../middleware/verificarToken');

router.get(
    '/reunion/:reunionId',
    verificarToken,
    controller.obtenerSeguimientoPorReunion
);

module.exports = router;
