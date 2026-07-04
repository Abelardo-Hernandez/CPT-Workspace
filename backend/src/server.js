require('dotenv').config({ quiet: true });

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {
        const connection = await pool.getConnection();

        console.log('Conexion a MySQL exitosa');

        connection.release();

        app.listen(PORT, () => {
            console.log(`Servidor iniciado en puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error conectando a MySQL');
        console.error(error);
        process.exit(1);
    }
}

iniciarServidor();
