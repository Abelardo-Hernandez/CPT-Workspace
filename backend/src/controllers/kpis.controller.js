const pool = require('../config/db');

async function reunionAceptaRegistros(reunionId) {
    const [[reunion]] = await pool.query(`
        SELECT estatus
        FROM (
            SELECT
                r.id,
                CASE
                    WHEN r.estatus = 'cancelada' THEN 'cancelada'
                    WHEN r.fecha_reunion > CURDATE() THEN 'programada'
                    WHEN r.id = (
                        SELECT r2.id
                        FROM reuniones r2
                        WHERE COALESCE(r2.estatus, '') <> 'cancelada'
                            AND r2.fecha_reunion <= CURDATE()
                        ORDER BY r2.fecha_reunion DESC, r2.id DESC
                        LIMIT 1
                    ) THEN 'activa'
                    ELSE 'finalizada'
                END AS estatus
            FROM reuniones r
            WHERE r.id = ?
        ) reunion_calculada
        WHERE estatus IN ('programada', 'activa')
    `, [reunionId]);

    return Boolean(reunion);
}

async function colaboradorPuedeVerProyecto(req, proyectoId) {
    if (req.user.rol !== 'colaborador') {
        return true;
    }

    const [[usuario]] = await pool.query(
        'SELECT area_id FROM usuarios WHERE id = ?',
        [req.user.id]
    );

    if (!usuario?.area_id) {
        return false;
    }

    const [[proyecto]] = await pool.query(
        'SELECT id FROM proyectos WHERE id = ? AND area_id = ? AND activo = 1',
        [proyectoId, usuario.area_id]
    );

    return Boolean(proyecto);
}

async function obtenerTipoMeta(kpiId) {
    const [[kpi]] = await pool.query(
        'SELECT tipo_meta FROM kpis WHERE id = ? AND activo = 1',
        [kpiId]
    );

    return kpi?.tipo_meta || null;
}

function calcularResultado(tipoMeta, meta, actual) {
    let resultado = 'cumple';

    if (tipoMeta === 'mayor_es_mejor' && Number(actual) < Number(meta)) {
        resultado = 'no_cumple';
    }

    if (tipoMeta === 'menor_es_mejor' && Number(actual) > Number(meta)) {
        resultado = 'no_cumple';
    }

    return resultado;
}

exports.obtenerKpis = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT *
            FROM kpis
            WHERE activo = 1
            ORDER BY nombre
        `);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener KPI' });
    }
};

exports.crearKpi = async (req, res) => {
    try {
        const { nombre, unidad, tipo_meta } = req.body;

        if (!nombre || !tipo_meta) {
            return res.status(400).json({
                message: 'Nombre y tipo de meta son obligatorios'
            });
        }

        await pool.query(`
            INSERT INTO kpis(nombre, unidad, tipo_meta)
            VALUES (?, ?, ?)
        `, [
            nombre,
            unidad || '%',
            tipo_meta
        ]);

        res.status(201).json({ message: 'KPI creado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear KPI' });
    }
};

exports.eliminarKpi = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            'UPDATE kpis SET activo = 0 WHERE id = ?',
            [id]
        );

        res.json({ message: 'KPI eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar KPI' });
    }
};

exports.obtenerResultadosKpi = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                kr.id,
                kr.proyecto_id,
                p.nombre AS proyecto,
                r.numero_reunion,
                k.nombre AS kpi,
                k.unidad,
                k.tipo_meta,
                kr.meta,
                kr.actual,
                kr.resultado,
                kr.tendencia
            FROM kpi_resultados kr
            LEFT JOIN proyectos p ON p.id = kr.proyecto_id
            LEFT JOIN reuniones r ON r.id = kr.reunion_id
            INNER JOIN kpis k ON k.id = kr.kpi_id
            ORDER BY COALESCE(p.nombre, ''), kr.id DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener resultados KPI' });
    }
};

exports.crearResultadoKpi = async (req, res) => {
    try {
        const {
            reunion_id,
            proyecto_id,
            kpi_id,
            meta,
            actual,
            tendencia
        } = req.body;

        if (!proyecto_id && !reunion_id) {
            return res.status(400).json({
                message: 'Proyecto o reunion son obligatorios'
            });
        }

        if (!kpi_id || meta === '' || actual === '') {
            return res.status(400).json({
                message: 'KPI, meta y actual son obligatorios'
            });
        }

        if (proyecto_id && !await colaboradorPuedeVerProyecto(req, proyecto_id)) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        if (reunion_id && !await reunionAceptaRegistros(reunion_id)) {
            return res.status(400).json({
                message: 'Solo puedes registrar KPI en reuniones programadas o activas'
            });
        }

        const tipoMeta = await obtenerTipoMeta(kpi_id);

        if (!tipoMeta) {
            return res.status(404).json({
                message: 'KPI no encontrado'
            });
        }

        const resultado = calcularResultado(tipoMeta, meta, actual);

        await pool.query(`
            INSERT INTO kpi_resultados
            (
                reunion_id,
                proyecto_id,
                kpi_id,
                meta,
                actual,
                resultado,
                tendencia
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            reunion_id || null,
            proyecto_id || null,
            kpi_id,
            meta,
            actual,
            resultado,
            tendencia || 'igual'
        ]);

        res.status(201).json({
            message: 'Resultado KPI registrado'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al registrar resultado KPI'
        });
    }
};

exports.obtenerResultadosPorProyecto = async (req, res) => {
    try {
        const { proyectoId } = req.params;

        if (!await colaboradorPuedeVerProyecto(req, proyectoId)) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        const [rows] = await pool.query(`
            SELECT
                kr.id,
                kr.proyecto_id,
                kr.kpi_id,
                k.nombre AS kpi,
                k.unidad,
                k.tipo_meta,
                kr.meta,
                kr.actual,
                kr.resultado,
                kr.tendencia
            FROM kpi_resultados kr
            INNER JOIN kpis k ON k.id = kr.kpi_id
            WHERE kr.proyecto_id = ?
            ORDER BY k.nombre
        `, [proyectoId]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener KPI del proyecto'
        });
    }
};

exports.actualizarResultadoKpi = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            kpi_id,
            meta,
            actual,
            tendencia
        } = req.body;

        const [[registro]] = await pool.query(
            'SELECT id, proyecto_id FROM kpi_resultados WHERE id = ?',
            [id]
        );

        if (!registro) {
            return res.status(404).json({
                message: 'Resultado KPI no encontrado'
            });
        }

        if (registro.proyecto_id && !await colaboradorPuedeVerProyecto(req, registro.proyecto_id)) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        if (!kpi_id || meta === '' || actual === '') {
            return res.status(400).json({
                message: 'KPI, meta y actual son obligatorios'
            });
        }

        const tipoMeta = await obtenerTipoMeta(kpi_id);

        if (!tipoMeta) {
            return res.status(404).json({
                message: 'KPI no encontrado'
            });
        }

        const resultado = calcularResultado(tipoMeta, meta, actual);

        await pool.query(`
            UPDATE kpi_resultados
            SET
                kpi_id = ?,
                meta = ?,
                actual = ?,
                resultado = ?,
                tendencia = ?
            WHERE id = ?
        `, [
            kpi_id,
            meta,
            actual,
            resultado,
            tendencia || 'igual',
            id
        ]);

        res.json({ message: 'Resultado KPI actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al actualizar resultado KPI'
        });
    }
};

exports.eliminarResultadoKpi = async (req, res) => {
    try {
        const { id } = req.params;

        const [[registro]] = await pool.query(
            'SELECT id, proyecto_id FROM kpi_resultados WHERE id = ?',
            [id]
        );

        if (!registro) {
            return res.status(404).json({
                message: 'Resultado KPI no encontrado'
            });
        }

        if (registro.proyecto_id && !await colaboradorPuedeVerProyecto(req, registro.proyecto_id)) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        await pool.query(
            'DELETE FROM kpi_resultados WHERE id = ?',
            [id]
        );

        res.json({ message: 'Resultado KPI eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al eliminar resultado KPI'
        });
    }
};

exports.obtenerResultadosPorReunion = async (req, res) => {
    try {
        const { reunionId } = req.params;

        const [rows] = await pool.query(`
            SELECT
                kr.id,
                k.nombre AS kpi,
                k.unidad,
                k.tipo_meta,
                kr.meta,
                kr.actual,
                kr.resultado,
                kr.tendencia
            FROM kpi_resultados kr
            INNER JOIN kpis k ON k.id = kr.kpi_id
            WHERE kr.reunion_id = ?
            ORDER BY k.nombre
        `, [reunionId]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener KPI de la reunion'
        });
    }
};
