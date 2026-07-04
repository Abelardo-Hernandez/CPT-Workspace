const pool = require('../config/db');

const proyectosService = require('../services/proyectos.service');

async function obtenerAreaUsuario(req) {
    if (req.user?.rol !== 'colaborador') {
        return null;
    }

    const [[usuario]] = await pool.query(
        'SELECT area_id FROM usuarios WHERE id = ?',
        [req.user.id]
    );

    return usuario?.area_id || null;
}

async function obtenerFiltroAreaProyecto(req, alias = 'p') {
    const areaId = await obtenerAreaUsuario(req);

    if (!areaId) {
        return {
            filtro: '',
            params: [],
            sinArea: req.user?.rol === 'colaborador'
        };
    }

    return {
        filtro: `AND ${alias}.area_id = ?`,
        params: [areaId],
        sinArea: false
    };
}

exports.obtenerResumen = async (req, res) => {
    try {
        const filtroProyecto = await obtenerFiltroAreaProyecto(req, 'p');

        if (filtroProyecto.sinArea) {
            return res.json({
                usuarios: 0,
                areas: 0,
                proyectos: 0,
                reuniones: 0
            });
        }

        const [[usuarios]] = await pool.query(
            req.user.rol === 'colaborador'
                ? 'SELECT COUNT(*) total FROM usuarios WHERE activo = 1 AND area_id = ?'
                : 'SELECT COUNT(*) total FROM usuarios WHERE activo = 1',
            filtroProyecto.params
        );

        const [[areas]] = await pool.query(
            req.user.rol === 'colaborador'
                ? 'SELECT COUNT(*) total FROM areas WHERE activo = 1 AND id = ?'
                : 'SELECT COUNT(*) total FROM areas WHERE activo = 1',
            filtroProyecto.params
        );

        const [[proyectos]] = await pool.query(`
            SELECT COUNT(*) total
            FROM proyectos p
            WHERE p.activo = 1
            ${filtroProyecto.filtro}
        `, filtroProyecto.params);

        const [[reuniones]] = await pool.query(
            'SELECT COUNT(*) total FROM reuniones'
        );

        res.json({
            usuarios: usuarios.total,
            areas: areas.total,
            proyectos: proyectos.total,
            reuniones: reuniones.total
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error obteniendo resumen'
        });
    }
};

exports.obtenerProyectosRecientes = async (req, res) => {
    try {
        const filtroProyecto = await obtenerFiltroAreaProyecto(req, 'p');

        if (filtroProyecto.sinArea) {
            return res.json([]);
        }

        const [rows] = await pool.query(`
            SELECT
                p.id,
                p.nombre,
                a.nombre AS area,
                u.nombre AS responsable,
                p.fecha_objetivo
            FROM proyectos p
            INNER JOIN areas a
                ON a.id = p.area_id
            LEFT JOIN usuarios u
                ON u.id = p.responsable_usuario_id
            WHERE p.activo = 1
            ${filtroProyecto.filtro}
            ORDER BY p.id DESC
            LIMIT 10
        `, filtroProyecto.params);

        res.json(rows);

    } catch(error) {
        console.error(error);

        res.status(500).json({
            message:'Error'
        });
    }
};

exports.obtenerResumenSeguimiento = async (req, res) => {
    try {
        const filtroProyecto = await obtenerFiltroAreaProyecto(req, 'p');

        if (filtroProyecto.sinArea) {
            return res.json({
                en_tiempo: 0,
                en_riesgo: 0,
                atrasado: 0,
                completado: 0,
                sin_seguimiento: 0
            });
        }

        if (req.user.rol !== 'colaborador') {
            const resumen = await proyectosService.obtenerResumenEstados();
            return res.json(resumen);
        }

        const [proyectos] = await pool.query(`
            SELECT p.id
            FROM proyectos p
            WHERE p.activo = 1
            ${filtroProyecto.filtro}
        `, filtroProyecto.params);

        const resumen = {
            en_tiempo: 0,
            en_riesgo: 0,
            atrasado: 0,
            completado: 0,
            sin_seguimiento: 0
        };

        for (const proyecto of proyectos) {
            const calculado = await proyectosService.calcularProyecto(proyecto.id);
            resumen[calculado.estatus] += 1;
        }

        res.json(resumen);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error obteniendo resumen de seguimiento'
        });
    }
};

exports.obtenerResumenAcciones = async (req, res) => {
    try {
        const filtroProyecto = await obtenerFiltroAreaProyecto(req, 'p');

        if (filtroProyecto.sinArea) {
            return res.json({
                pendiente: 0,
                en_proceso: 0,
                terminada: 0,
                vencida: 0
            });
        }

        const [rows] = await pool.query(`
            SELECT
                ac.estatus,
                COUNT(*) AS total
            FROM acciones ac
            INNER JOIN proyectos p ON p.id = ac.proyecto_id
            WHERE p.activo = 1
            ${filtroProyecto.filtro}
            GROUP BY ac.estatus
        `, filtroProyecto.params);

        const resumen = {
            pendiente: 0,
            en_proceso: 0,
            terminada: 0,
            vencida: 0
        };

        rows.forEach(row => {
            resumen[row.estatus] = row.total;
        });

        res.json(resumen);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error obteniendo resumen de acciones'
        });
    }
};

exports.obtenerInfoReuniones = async (req, res) => {
    try {
        const [[ultima]] = await pool.query(`
            SELECT
                numero_reunion,
                fecha_reunion
            FROM reuniones
            ORDER BY fecha_reunion DESC
            LIMIT 1
        `);

        const [[proxima]] = await pool.query(`
            SELECT
                numero_reunion,
                fecha_proxima_reunion,
                hora_proxima_reunion
            FROM reuniones
            WHERE fecha_proxima_reunion IS NOT NULL
            ORDER BY fecha_proxima_reunion ASC
            LIMIT 1
        `);

        res.json({
            ultima,
            proxima
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error obteniendo reuniones'
        });
    }
};

exports.obtenerProximasAcciones = async (req, res) => {
    try {
        const filtroProyecto = await obtenerFiltroAreaProyecto(req, 'p');

        if (filtroProyecto.sinArea) {
            return res.json([]);
        }

        const [rows] = await pool.query(`
            SELECT
                ac.descripcion,
                ac.fecha_compromiso,
                ac.estatus
            FROM acciones ac
            INNER JOIN proyectos p ON p.id = ac.proyecto_id
            WHERE ac.estatus IN ('pendiente', 'en_proceso')
            AND p.activo = 1
            ${filtroProyecto.filtro}
            ORDER BY ac.fecha_compromiso ASC
            LIMIT 5
        `, filtroProyecto.params);

        res.json(rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error'
        });
    }
};

exports.obtenerAccionesVencidas = async (req, res) => {
    try {
        const filtroProyecto = await obtenerFiltroAreaProyecto(req, 'p');

        if (filtroProyecto.sinArea) {
            return res.json([]);
        }

        const [rows] = await pool.query(`
            SELECT
                ac.descripcion,
                ac.fecha_compromiso
            FROM acciones ac
            INNER JOIN proyectos p ON p.id = ac.proyecto_id
            WHERE ac.estatus = 'vencida'
            AND p.activo = 1
            ${filtroProyecto.filtro}
            ORDER BY ac.fecha_compromiso ASC
            LIMIT 5
        `, filtroProyecto.params);

        res.json(rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error'
        });
    }
};

exports.obtenerAvanceGlobal = async (req, res) => {
    try {
        if (req.user.rol !== 'colaborador') {
            const avanceGlobal = await proyectosService.obtenerAvanceGlobal();

            return res.json({
                avance_global: avanceGlobal
            });
        }

        const filtroProyecto = await obtenerFiltroAreaProyecto(req, 'p');

        if (filtroProyecto.sinArea) {
            return res.json({
                avance_global: 0
            });
        }

        const [proyectos] = await pool.query(`
            SELECT p.id
            FROM proyectos p
            WHERE p.activo = 1
            ${filtroProyecto.filtro}
        `, filtroProyecto.params);

        if (!proyectos.length) {
            return res.json({
                avance_global: 0
            });
        }

        let total = 0;

        for (const proyecto of proyectos) {
            const calculado = await proyectosService.calcularProyecto(proyecto.id);
            total += Number(calculado.avance || 0);
        }

        res.json({
            avance_global: Math.round(total / proyectos.length)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error obteniendo avance global'
        });
    }
};

exports.resumenKpis = async (req, res) => {
    try {
        const [[datos]] = await pool.query(`
            SELECT
                SUM(resultado='cumple') AS cumple,
                SUM(resultado='no_cumple') AS no_cumple,
                COUNT(*) total
            FROM kpi_resultados
            WHERE id IN(
                SELECT MAX(id)
                FROM kpi_resultados
                GROUP BY kpi_id
            )
        `);

        res.json(datos);

    } catch(error){
        console.error(error);

        res.status(500).json({
            message:'Error al obtener KPI'
        });
    }
};
