const pool = require('../config/db');

const proyectosService = require('../services/proyectos.service');

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

exports.obtenerProyectos = async (req, res) => {
    try {
        const params = [];
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
                p.id,
                p.nombre,
                p.objetivo,
                p.area_id,
                p.responsable_usuario_id,
                p.fecha_inicio,
                p.fecha_objetivo,
                p.activo,
                a.nombre AS area,
                u.nombre AS responsable
            FROM proyectos p
            INNER JOIN areas a ON a.id = p.area_id
            LEFT JOIN usuarios u ON u.id = p.responsable_usuario_id
            WHERE p.activo = 1
            ${filtroArea}
            ORDER BY p.fecha_creacion DESC
        `, params);

        const proyectos = [];

        for (const row of rows) {
            const detalle = await proyectosService.calcularProyecto(row.id);

            proyectos.push({
                ...row,
                estatus: detalle?.estatus || 'sin_seguimiento',
                avance: detalle?.avance || 0
            });
        }

        res.json(proyectos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener proyectos' });
    }
};

exports.crearProyecto = async (req, res) => {
    try {
        const {
            nombre,
            area_id,
            responsable_usuario_id,
            objetivo,
            fecha_inicio,
            fecha_objetivo
        } = req.body;

        if (req.user.rol === 'consulta') {
            return res.status(403).json({
                message: 'No autorizado'
            });
        }

        let areaProyecto = area_id;

        if (req.user.rol === 'colaborador') {
            areaProyecto = await obtenerAreaUsuario(req.user.id);
        }

        if (!nombre || !areaProyecto) {
            return res.status(400).json({
                message: 'Nombre y area son obligatorios'
            });
        }

        if (req.user.rol === 'colaborador' && responsable_usuario_id) {
            const [[responsable]] = await pool.query(
                'SELECT id FROM usuarios WHERE id = ? AND area_id = ? AND activo = 1',
                [responsable_usuario_id, areaProyecto]
            );

            if (!responsable) {
                return res.status(400).json({
                    message: 'El responsable debe pertenecer a tu area'
                });
            }
        }

        await pool.query(`
            INSERT INTO proyectos
            (
                nombre,
                area_id,
                responsable_usuario_id,
                objetivo,
                fecha_inicio,
                fecha_objetivo
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            nombre,
            areaProyecto,
            responsable_usuario_id || null,
            objetivo || null,
            fecha_inicio || null,
            fecha_objetivo || null
        ]);

        res.status(201).json({ message: 'Proyecto creado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear proyecto' });
    }
};

exports.actualizarProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            area_id,
            responsable_usuario_id,
            objetivo,
            fecha_inicio,
            fecha_objetivo
        } = req.body;

        if (req.user.rol === 'consulta') {
            return res.status(403).json({
                message: 'No autorizado'
            });
        }

        const permitido = await colaboradorPuedeVerProyecto(req, id);

        if (!permitido) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        let areaProyecto = area_id;

        if (req.user.rol === 'colaborador') {
            areaProyecto = await obtenerAreaUsuario(req.user.id);
        }

        if (!nombre || !areaProyecto) {
            return res.status(400).json({
                message: 'Nombre y area son obligatorios'
            });
        }

        if (req.user.rol === 'colaborador' && responsable_usuario_id) {
            const [[responsable]] = await pool.query(
                'SELECT id FROM usuarios WHERE id = ? AND area_id = ? AND activo = 1',
                [responsable_usuario_id, areaProyecto]
            );

            if (!responsable) {
                return res.status(400).json({
                    message: 'El responsable debe pertenecer a tu area'
                });
            }
        }

        await pool.query(`
            UPDATE proyectos
            SET
                nombre = ?,
                area_id = ?,
                responsable_usuario_id = ?,
                objetivo = ?,
                fecha_inicio = ?,
                fecha_objetivo = ?
            WHERE id = ? AND activo = 1
        `, [
            nombre,
            areaProyecto,
            responsable_usuario_id || null,
            objetivo || null,
            fecha_inicio || null,
            fecha_objetivo || null,
            id
        ]);

        res.json({ message: 'Proyecto actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar proyecto' });
    }
};

exports.eliminarProyecto = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.rol === 'consulta') {
            return res.status(403).json({
                message: 'No autorizado'
            });
        }

        const permitido = await colaboradorPuedeVerProyecto(req, id);

        if (!permitido) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        await pool.query(
            'UPDATE proyectos SET activo = 0 WHERE id = ?',
            [id]
        );

        res.json({ message: 'Proyecto eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar proyecto' });
    }
};

exports.obtenerProyectoPorId = async (req, res) => {
    try {
        const permitido = await colaboradorPuedeVerProyecto(req, req.params.id);

        if (!permitido) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        const proyecto = await proyectosService.calcularProyecto(req.params.id);

        if (!proyecto) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        res.json(proyecto);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener proyecto'
        });
    }
};

exports.obtenerTimelineProyecto = async (req, res) => {
    try {
        const { id } = req.params;

        const permitido = await colaboradorPuedeVerProyecto(req, id);

        if (!permitido) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        const [seguimientos] = await pool.query(`
            SELECT
                'seguimiento' AS tipo,
                ps.fecha_registro AS fecha,
                CONCAT('Avance ', ps.avance, '%') AS titulo,
                ps.comentario AS descripcion,
                ps.estatus AS estado
            FROM proyecto_seguimiento ps
            WHERE ps.proyecto_id = ?
        `, [id]);

        const [acciones] = await pool.query(`
            SELECT
                'accion' AS tipo,
                ac.fecha_creacion AS fecha,
                'Accion registrada' AS titulo,
                ac.descripcion AS descripcion,
                ac.estatus AS estado
            FROM acciones ac
            WHERE ac.proyecto_id = ?
        `, [id]);

        const timeline = [
            ...seguimientos,
            ...acciones
        ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        res.json(timeline);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener timeline' });
    }
};
