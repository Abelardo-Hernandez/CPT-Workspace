require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {

    try {

        const connection = await pool.getConnection();

        console.log('✅ Conexión a MySQL exitosa');

        connection.release();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
        });

    } catch (error) {

        console.error('❌ Error conectando a MySQL');
        console.error(error);

    }

}

iniciarServidor();