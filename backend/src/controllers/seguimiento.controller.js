const pool = require('../config/db');

exports.obtenerSeguimientoPorReunion = async (req, res) => {
    try {
        const { reunionId } = req.params;

        const [rows] = await pool.query(`
            SELECT
                ps.id,
                ps.avance,
                ps.estatus,
                ps.comentario,
                ps.fecha_registro,
                p.nombre AS proyecto,
                a.nombre AS area
            FROM proyecto_seguimiento ps
            INNER JOIN proyectos p ON p.id = ps.proyecto_id
            INNER JOIN areas a ON a.id = p.area_id
            WHERE ps.reunion_id = ?
            ORDER BY ps.fecha_registro DESC
        `, [reunionId]);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener seguimiento de la reunion'
        });
    }
};
