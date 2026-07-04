const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.obtenerUsuarios = async (req, res) => {

    try {
        if (req.user.rol === 'consulta') {
            return res.status(403).json({
                message: 'No autorizado'
            });
        }

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

            filtroArea = 'WHERE u.area_id = ?';
            params.push(usuario.area_id);
        }

        const [rows] = await pool.query(`
            SELECT
                u.id,
                u.nombre,
                u.usuario,
                u.rol,
                u.area_id,
                a.nombre AS area,
                u.activo
            FROM usuarios u
            LEFT JOIN areas a ON a.id = u.area_id
            ${filtroArea}
            ORDER BY u.nombre
        `, params);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error al obtener usuarios'
        });

    }

};

exports.crearUsuario = async (req, res) => {

    try {

        const {
            nombre,
            usuario,
            password,
            rol,
            area_id
        } = req.body;

        const hash = await bcrypt.hash(password, 10);

        await pool.query(`
            INSERT INTO usuarios
            (
                nombre,
                usuario,
                password,
                rol,
                area_id
            )
            VALUES (?, ?, ?, ?, ?)
        `,
        [
            nombre,
            usuario,
            hash,
            rol,
            area_id || null
        ]);

        res.status(201).json({
            message: 'Usuario creado'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error al crear usuario'
        });

    }

};

exports.actualizarUsuario = async (req, res) => {

    try {

        const { id } = req.params;
        const {
            nombre,
            usuario,
            password,
            rol,
            area_id,
            activo
        } = req.body;

        if (!nombre || !usuario || !rol) {
            return res.status(400).json({
                message: 'Nombre, usuario y rol son obligatorios'
            });
        }

        if (password) {
            const hash = await bcrypt.hash(password, 10);

            await pool.query(`
                UPDATE usuarios
                SET
                    nombre = ?,
                    usuario = ?,
                    password = ?,
                    rol = ?,
                    area_id = ?,
                    activo = ?
                WHERE id = ?
            `, [
                nombre,
                usuario,
                hash,
                rol,
                area_id || null,
                activo ? 1 : 0,
                id
            ]);
        } else {
            await pool.query(`
                UPDATE usuarios
                SET
                    nombre = ?,
                    usuario = ?,
                    rol = ?,
                    area_id = ?,
                    activo = ?
                WHERE id = ?
            `, [
                nombre,
                usuario,
                rol,
                area_id || null,
                activo ? 1 : 0,
                id
            ]);
        }

        res.json({
            message: 'Usuario actualizado'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error al actualizar usuario'
        });

    }

};

exports.eliminarUsuario = async (req, res) => {

    try {

        const { id } = req.params;

        if (Number(id) === Number(req.user.id)) {
            return res.status(400).json({
                message: 'No puedes eliminar tu propio usuario'
            });
        }

        await pool.query(
            'UPDATE usuarios SET activo = 0 WHERE id = ?',
            [id]
        );

        res.json({
            message: 'Usuario eliminado'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error al eliminar usuario'
        });

    }

};
