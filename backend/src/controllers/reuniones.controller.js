const pool = require('../config/db');

const consultaReunionesConEstatus = `
    SELECT
        r.id,
        r.numero_reunion,
        r.fecha_reunion,
        r.tema_habilidad_blanda,
        r.fecha_proxima_reunion,
        r.hora_proxima_reunion,
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
`;

exports.obtenerReuniones = async (req, res) => {
    try {
        const seleccionables = req.query.seleccionables === '1';

        const [rows] = await pool.query(`
            SELECT *
            FROM (${consultaReunionesConEstatus}) reuniones_calculadas
            ${seleccionables ? "WHERE estatus IN ('programada', 'activa')" : ''}
            ORDER BY fecha_reunion DESC, id DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener reuniones' });
    }
};

exports.crearReunion = async (req, res) => {
    try {
        const {
            numero_reunion,
            fecha_reunion,
            tema_habilidad_blanda,
            fecha_proxima_reunion,
            hora_proxima_reunion
        } = req.body;

        await pool.query(`
            INSERT INTO reuniones
            (
                numero_reunion,
                fecha_reunion,
                tema_habilidad_blanda,
                fecha_proxima_reunion,
                hora_proxima_reunion,
                creada_por
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            numero_reunion,
            fecha_reunion,
            tema_habilidad_blanda || null,
            fecha_proxima_reunion || null,
            hora_proxima_reunion || null,
            req.user.id
        ]);

        res.status(201).json({ message: 'Reunión creada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear reunión' });
    }
};

exports.obtenerReunionPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [[row]] = await pool.query(`
            SELECT *
            FROM (${consultaReunionesConEstatus}) reuniones_calculadas
            WHERE id = ?
        `, [id]);

        if (!row) {
            return res.status(404).json({
                message: 'Reunión no encontrada'
            });
        }

        res.json(row);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener reunión'
        });
    }
};

exports.cancelarReunion = async (req, res) => {
    try {
        const { id } = req.params;

        const [[reunion]] = await pool.query(
            'SELECT id FROM reuniones WHERE id = ?',
            [id]
        );

        if (!reunion) {
            return res.status(404).json({
                message: 'Reunion no encontrada'
            });
        }

        await pool.query(
            "UPDATE reuniones SET estatus = 'cancelada' WHERE id = ?",
            [id]
        );

        res.json({ message: 'Reunion cancelada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al cancelar reunion'
        });
    }
};
