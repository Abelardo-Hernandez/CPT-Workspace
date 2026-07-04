const pool = require('../config/db');

function fechaObjetivoVencida(fechaObjetivo) {
    if (!fechaObjetivo) {
        return false;
    }

    const objetivo = new Date(fechaObjetivo);

    if (Number.isNaN(objetivo.getTime())) {
        return false;
    }

    objetivo.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return objetivo < hoy;
}

async function calcularProyecto(proyectoId) {
    const [[proyecto]] = await pool.query(`
        SELECT
            p.id,
            p.nombre,
            p.objetivo,
            p.fecha_inicio,
            p.fecha_objetivo,
            a.nombre AS area,
            u.nombre AS responsable
        FROM proyectos p
        INNER JOIN areas a ON a.id = p.area_id
        LEFT JOIN usuarios u ON u.id = p.responsable_usuario_id
        WHERE p.id = ? AND p.activo = 1
    `, [proyectoId]);

    if (!proyecto) {
        return null;
    }

    const [[acciones]] = await pool.query(`
        SELECT
            COUNT(id) AS total_acciones,
            SUM(CASE WHEN estatus = 'terminada' THEN 1 ELSE 0 END) AS acciones_terminadas,
            SUM(CASE WHEN estatus = 'pendiente' THEN 1 ELSE 0 END) AS acciones_pendientes,
            SUM(CASE WHEN estatus = 'en_proceso' THEN 1 ELSE 0 END) AS acciones_en_proceso,
            SUM(CASE WHEN estatus = 'vencida' THEN 1 ELSE 0 END) AS acciones_vencidas
        FROM acciones
        WHERE proyecto_id = ?
    `, [proyectoId]);

    const totalAcciones = Number(acciones.total_acciones || 0);
    const accionesTerminadas = Number(acciones.acciones_terminadas || 0);
    const accionesPendientes = Number(acciones.acciones_pendientes || 0);
    const accionesEnProceso = Number(acciones.acciones_en_proceso || 0);
    const accionesVencidas = Number(acciones.acciones_vencidas || 0);

    const avance = totalAcciones === 0
        ? 0
        : Math.round((accionesTerminadas / totalAcciones) * 100);

    let estatus = 'sin_seguimiento';
    const objetivoVencido = fechaObjetivoVencida(proyecto.fecha_objetivo);

    if (avance >= 100 && totalAcciones > 0) {
        estatus = 'completado';
    } else if (objetivoVencido || accionesVencidas > 0) {
        estatus = 'atrasado';
    } else if (proyecto.fecha_objetivo || totalAcciones > 0) {
        estatus = 'en_tiempo';
    }

    const [[reuniones]] = await pool.query(`
        SELECT COUNT(DISTINCT reunion_id) AS total
        FROM acciones
        WHERE proyecto_id = ?
    `, [proyectoId]);

    const [[ultimoSeguimiento]] = await pool.query(`
        SELECT comentario, fecha_registro
        FROM proyecto_seguimiento
        WHERE proyecto_id = ?
        ORDER BY id DESC
        LIMIT 1
    `, [proyectoId]);

    return {
        ...proyecto,
        avance,
        estatus,
        total_acciones: totalAcciones,
        acciones_terminadas: accionesTerminadas,
        acciones_pendientes: accionesPendientes,
        acciones_en_proceso: accionesEnProceso,
        acciones_vencidas: accionesVencidas,
        total_reuniones: Number(reuniones.total || 0),
        ultimo_comentario: ultimoSeguimiento?.comentario || null,
        ultima_actualizacion: ultimoSeguimiento?.fecha_registro || null
    };
}

async function obtenerResumenEstados() {
    const [proyectos] = await pool.query(`
        SELECT id
        FROM proyectos
        WHERE activo = 1
    `);

    const resumen = {
        en_tiempo: 0,
        en_riesgo: 0,
        atrasado: 0,
        completado: 0
    };

    for (const proyecto of proyectos) {
        const detalle = await calcularProyecto(proyecto.id);

        if (!detalle) continue;

        if (detalle.estatus === 'completado') resumen.completado++;
        else if (detalle.estatus === 'atrasado') resumen.atrasado++;
        else if (detalle.estatus === 'en_tiempo') resumen.en_tiempo++;
    }

    return resumen;
}

async function obtenerAvanceGlobal() {
    const [[row]] = await pool.query(`
        SELECT
            COUNT(ac.id) AS total_acciones,
            SUM(CASE WHEN estatus = 'terminada' THEN 1 ELSE 0 END) AS terminadas
        FROM acciones ac
        INNER JOIN proyectos p ON p.id = ac.proyecto_id
        WHERE p.activo = 1
    `);

    const total = Number(row.total_acciones || 0);
    const terminadas = Number(row.terminadas || 0);

    const avanceGlobal = total === 0
        ? 0
        : Math.round((terminadas / total) * 100);

    return avanceGlobal;
}

module.exports = {
    calcularProyecto,
    obtenerResumenEstados,
    obtenerAvanceGlobal
};
