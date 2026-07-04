const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {

    try {

        console.log('BODY:', req.body); //Validacion en consola
        const { usuario, password } = req.body;

        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE usuario = ? AND activo = 1',
            [usuario]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: 'Usuario no encontrado'
            });
        }

        const user = rows[0];

        const coincide = await bcrypt.compare(
            password,
            user.password
        );

        if (!coincide) {
            return res.status(401).json({
                message: 'Contraseña incorrecta'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                rol: user.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        res.json({
            token,
            usuario: {
                id: user.id,
                nombre: user.nombre,
                rol: user.rol
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error interno'
        });

    }

};