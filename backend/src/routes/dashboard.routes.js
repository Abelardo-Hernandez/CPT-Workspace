const express = require('express');
const router = express.Router();

const controller =
require('../controllers/dashboard.controller');

const verificarToken =
require('../middleware/verificarToken');

router.get(
    '/resumen',
    verificarToken,
    controller.obtenerResumen
);

router.get(
    '/proyectos-recientes',
    verificarToken,
    controller.obtenerProyectosRecientes
);

router.get(
    '/seguimiento-resumen',
    verificarToken,
    controller.obtenerResumenSeguimiento
);

router.get(
    '/acciones-resumen',
    verificarToken,
    controller.obtenerResumenAcciones
);

router.get(
    '/info-reuniones',
    verificarToken,
    controller.obtenerInfoReuniones
);

router.get(
    '/proximas-acciones',
    verificarToken,
    controller.obtenerProximasAcciones
);

router.get(
    '/acciones-vencidas',
    verificarToken,
    controller.obtenerAccionesVencidas
);

router.get(
    '/avance-global',
    verificarToken,
    controller.obtenerAvanceGlobal
);

router.get(
    '/kpis-resumen',
    verificarToken,
    controller.resumenKpis
);

module.exports = router;