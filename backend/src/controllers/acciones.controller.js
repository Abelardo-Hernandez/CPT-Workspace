const pool = require('../config/db');

async function obtenerAreaUsuario(usuarioId) {
    const [[usuario]] = await pool.query(
        'SELECT area_id FROM usuarios WHERE id = ?',
        [usuarioId]
    );

    return usuario?.area_id || null;
}

async function colaboradorPuedeVerProyecto(req, proyectoId) {
    if (req.user.rol !== 'colaborador') {
        return true;
    }

    if (!proyectoId) {
        return false;
    }

    const areaId = await obtenerAreaUsuario(req.user.id);

    if (!areaId) {
        return false;
    }

    const [[proyecto]] = await pool.query(
        'SELECT id FROM proyectos WHERE id = ? AND area_id = ? AND activo = 1',
        [proyectoId, areaId]
    );

    return Boolean(proyecto);
}

async function obtenerAccionPermitida(req, accionId) {
    const params = [accionId];
    let filtroArea = '';

    if (req.user.rol === 'colaborador') {
        const areaId = await obtenerAreaUsuario(req.user.id);

        if (!areaId) {
            return null;
        }

        filtroArea = 'AND p.area_id = ?';
        params.push(areaId);
    }

    const [[accion]] = await pool.query(`
        SELECT ac.id, ac.proyecto_id
        FROM acciones ac
        LEFT JOIN proyectos p ON p.id = ac.proyecto_id
        WHERE ac.id = ?
        ${filtroArea}
    `, params);

    return accion || null;
}

function estatusAccionValido(estatus) {
    return [
        'pendiente',
        'en_proceso',
        'terminada',
        'vencida'
    ].includes(estatus);
}

function prioridadAccionValida(prioridad) {
    return [
        'alta',
        'media',
        'baja'
    ].includes(prioridad);
}

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

exports.obtenerAcciones = async (req, res) => {
    try {
        const params = [];
        let filtroArea = '';

        if (req.user.rol === 'colaborador') {
            const areaId = await obtenerAreaUsuario(req.user.id);

            if (!areaId) {
                return res.json([]);
            }

            filtroArea = 'WHERE p.area_id = ?';
            params.push(areaId);
        }

        const [rows] = await pool.query(`
            SELECT
                ac.id,
                ac.reunion_id,
                ac.responsable_usuario_id,
                ac.descripcion,
                ac.fecha_compromiso,
                ac.prioridad,
                ac.estatus,
                ac.fecha_creacion,
                r.numero_reunion,
                p.nombre AS proyecto,
                u.nombre AS responsable
            FROM acciones ac
            INNER JOIN reuniones r ON r.id = ac.reunion_id
            LEFT JOIN proyectos p ON p.id = ac.proyecto_id
            INNER JOIN usuarios u ON u.id = ac.responsable_usuario_id
            ${filtroArea}
            ORDER BY ac.fecha_compromiso ASC
        `, params);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener acciones' });
    }
};

exports.crearAccion = async (req, res) => {
    try {
        const {
            reunion_id,
            proyecto_id,
            descripcion,
            responsable_usuario_id,
            fecha_compromiso,
            prioridad,
            estatus
        } = req.body;

        if (!reunion_id || !descripcion || !responsable_usuario_id) {
            return res.status(400).json({
                message: 'Reunion, descripcion y responsable son obligatorios'
            });
        }

        if (!await reunionAceptaRegistros(reunion_id)) {
            return res.status(400).json({
                message: 'Solo puedes registrar acciones en reuniones programadas o activas'
            });
        }

        const permitido = await colaboradorPuedeVerProyecto(req, proyecto_id);

        if (!permitido) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        if (req.user.rol === 'colaborador') {
            const areaId = await obtenerAreaUsuario(req.user.id);

            const [[responsable]] = await pool.query(
                'SELECT id FROM usuarios WHERE id = ? AND area_id = ? AND activo = 1',
                [responsable_usuario_id, areaId]
            );

            if (!responsable) {
                return res.status(400).json({
                    message: 'El responsable debe pertenecer a tu area'
                });
            }
        }

        await pool.query(`
            INSERT INTO acciones
            (
                reunion_id,
                proyecto_id,
                descripcion,
                responsable_usuario_id,
                fecha_compromiso,
                prioridad,
                estatus
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            reunion_id,
            proyecto_id || null,
            descripcion,
            responsable_usuario_id,
            fecha_compromiso || null,
            prioridad || 'media',
            estatus || 'pendiente'
        ]);

        res.status(201).json({ message: 'Accion creada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear accion' });
    }
};

exports.actualizarAccion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            reunion_id,
            proyecto_id,
            descripcion,
            responsable_usuario_id,
            fecha_compromiso,
            prioridad,
            estatus
        } = req.body;

        if (req.user.rol === 'consulta') {
            return res.status(403).json({
                message: 'No autorizado'
            });
        }

        const accion = await obtenerAccionPermitida(req, id);

        if (!accion) {
            return res.status(404).json({
                message: 'Accion no encontrada'
            });
        }

        if (!reunion_id || !descripcion || !responsable_usuario_id) {
            return res.status(400).json({
                message: 'Reunion, descripcion y responsable son obligatorios'
            });
        }

        if (!await reunionAceptaRegistros(reunion_id)) {
            return res.status(400).json({
                message: 'Solo puedes usar reuniones programadas o activas'
            });
        }

        const permitido = await colaboradorPuedeVerProyecto(req, proyecto_id);

        if (!permitido) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        if (prioridad && !prioridadAccionValida(prioridad)) {
            return res.status(400).json({
                message: 'Prioridad no valida'
            });
        }

        if (estatus && !estatusAccionValido(estatus)) {
            return res.status(400).json({
                message: 'Estatus no valido'
            });
        }

        if (req.user.rol === 'colaborador') {
            const areaId = await obtenerAreaUsuario(req.user.id);

            const [[responsable]] = await pool.query(
                'SELECT id FROM usuarios WHERE id = ? AND area_id = ? AND activo = 1',
                [responsable_usuario_id, areaId]
            );

            if (!responsable) {
                return res.status(400).json({
                    message: 'El responsable debe pertenecer a tu area'
                });
            }
        }

        await pool.query(`
            UPDATE acciones
            SET
                reunion_id = ?,
                proyecto_id = ?,
                descripcion = ?,
                responsable_usuario_id = ?,
                fecha_compromiso = ?,
                prioridad = ?,
                estatus = ?
            WHERE id = ?
        `, [
            reunion_id,
            proyecto_id || null,
            descripcion,
            responsable_usuario_id,
            fecha_compromiso || null,
            prioridad || 'media',
            estatus || 'pendiente',
            id
        ]);

        res.json({ message: 'Accion actualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar accion' });
    }
};

exports.actualizarEstatusAccion = async (req, res) => {
    try {
        const { id } = req.params;
        const { estatus } = req.body;

        if (!estatusAccionValido(estatus)) {
            return res.status(400).json({
                message: 'Estatus no valido'
            });
        }

        if (req.user.rol === 'colaborador') {
            const areaId = await obtenerAreaUsuario(req.user.id);

            const [[accion]] = await pool.query(`
                SELECT ac.id
                FROM acciones ac
                INNER JOIN proyectos p ON p.id = ac.proyecto_id
                WHERE ac.id = ? AND p.area_id = ?
            `, [id, areaId]);

            if (!accion) {
                return res.status(404).json({
                    message: 'Accion no encontrada'
                });
            }
        }

        await pool.query(`
            UPDATE acciones
            SET estatus = ?
            WHERE id = ?
        `, [estatus, id]);

        res.json({
            message: 'Estatus actualizado'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al actualizar estatus'
        });
    }
};

exports.eliminarAccion = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.rol === 'consulta') {
            return res.status(403).json({
                message: 'No autorizado'
            });
        }

        const accion = await obtenerAccionPermitida(req, id);

        if (!accion) {
            return res.status(404).json({
                message: 'Accion no encontrada'
            });
        }

        await pool.query(
            'DELETE FROM acciones WHERE id = ?',
            [id]
        );

        res.json({ message: 'Accion eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al eliminar accion'
        });
    }
};

exports.obtenerAccionesPorReunion = async (req, res) => {
    try {
        const { reunionId } = req.params;
        const params = [reunionId];
        let filtroArea = '';

        if (req.user.rol === 'colaborador') {
            const areaId = await obtenerAreaUsuario(req.user.id);

            if (!areaId) {
                return res.json([]);
            }

            filtroArea = 'AND p.area_id = ?';
            params.push(areaId);
        }

        const [rows] = await pool.query(`
            SELECT
                ac.id,
                ac.reunion_id,
                ac.responsable_usuario_id,
                ac.descripcion,
                ac.fecha_compromiso,
                ac.prioridad,
                ac.estatus,
                p.nombre AS proyecto,
                u.nombre AS responsable
            FROM acciones ac
            LEFT JOIN proyectos p ON p.id = ac.proyecto_id
            INNER JOIN usuarios u ON u.id = ac.responsable_usuario_id
            WHERE ac.reunion_id = ?
            ${filtroArea}
            ORDER BY ac.fecha_compromiso ASC
        `, params);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener acciones de la reunion'
        });
    }
};

exports.obtenerAccionesPorProyecto = async (req, res) => {
    try {
        const { proyectoId } = req.params;

        const permitido = await colaboradorPuedeVerProyecto(req, proyectoId);

        if (!permitido) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        const [rows] = await pool.query(`
            SELECT
                ac.id,
                ac.reunion_id,
                ac.responsable_usuario_id,
                ac.descripcion,
                ac.fecha_compromiso,
                ac.prioridad,
                ac.estatus,
                ac.fecha_creacion,
                r.numero_reunion,
                p.nombre AS proyecto,
                u.nombre AS responsable
            FROM acciones ac
            INNER JOIN reuniones r ON r.id = ac.reunion_id
            LEFT JOIN proyectos p ON p.id = ac.proyecto_id
            INNER JOIN usuarios u ON u.id = ac.responsable_usuario_id
            WHERE ac.proyecto_id = ?
            ORDER BY ac.fecha_compromiso ASC
        `, [proyectoId]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener acciones del proyecto'
        });
    }
};

