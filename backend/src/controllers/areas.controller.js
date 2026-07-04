const pool = require('../config/db');

exports.obtenerAreas = async (req, res) => {

    try {
        const params = [];
        let filtroArea = '';

        if (req.user.rol === 'colaborador') {
            const [[usuario]] = await pool.query(
                'SELECT area_id FROM usuarios WHERE id = ?',
                [req.user.id]
            );

            if (!usuario?.area_id) {
                return res.json([]);
            }

            filtroArea = 'AND id = ?';
            params.push(usuario.area_id);
        }

        const [rows] = await pool.query(`
            SELECT *
            FROM areas
            WHERE activo = 1
            ${filtroArea}
            ORDER BY nombre
        `, params);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error al obtener áreas'
        });

    }

};

exports.crearArea = async (req, res) => {

    try {

        const { nombre } = req.body;

        await pool.query(`
            INSERT INTO areas(nombre)
            VALUES(?)
        `, [nombre]);

        res.status(201).json({
            message: 'Área creada'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error al crear área'
        });

    }

};

exports.eliminarArea = async (req, res) => {

    try {

        const { id } = req.params;

        const [[proyectos]] = await pool.query(
            'SELECT COUNT(*) AS total FROM proyectos WHERE area_id = ? AND activo = 1',
            [id]
        );

        const [[usuarios]] = await pool.query(
            'SELECT COUNT(*) AS total FROM usuarios WHERE area_id = ? AND activo = 1',
            [id]
        );

        if (Number(proyectos.total || 0) > 0 || Number(usuarios.total || 0) > 0) {
            return res.status(400).json({
                message: 'No se puede eliminar un area con proyectos o usuarios activos'
            });
        }

        await pool.query(
            'UPDATE areas SET activo = 0 WHERE id = ?',
            [id]
        );

        res.json({
            message: 'Area eliminada'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error al eliminar area'
        });

    }

};
