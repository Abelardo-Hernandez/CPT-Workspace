const express = require('express');
const router = express.Router();

const controller = require('../controllers/kpis.controller');

const verificarToken = require('../middleware/verificarToken');
const verificarAdmin = require('../middleware/verificarAdmin');

function verificarAdminOColaborador(req, res, next) {
    if (!['administrador', 'colaborador'].includes(req.user.rol)) {
        return res.status(403).json({
            message: 'No autorizado'
        });
    }

    next();
}

router.get(
    '/',
    verificarToken,
    controller.obtenerKpis
);

router.post(
    '/',
    verificarToken,
    verificarAdminOColaborador,
    controller.crearKpi
);

router.delete(
    '/:id',
    verificarToken,
    verificarAdmin,
    controller.eliminarKpi
);

router.get(
    '/resultados',
    verificarToken,
    controller.obtenerResultadosKpi
);

router.post(
    '/resultados',
    verificarToken,
    controller.crearResultadoKpi
);

router.get(
    '/resultados/proyecto/:proyectoId',
    verificarToken,
    controller.obtenerResultadosPorProyecto
);

router.get(
    '/resultados/reunion/:reunionId',
    verificarToken,
    controller.obtenerResultadosPorReunion
);

router.put(
    '/resultados/:id',
    verificarToken,
    controller.actualizarResultadoKpi
);

router.delete(
    '/resultados/:id',
    verificarToken,
    controller.eliminarResultadoKpi
);

module.exports = router;
