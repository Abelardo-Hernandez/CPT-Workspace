const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const areasRoutes = require('./routes/areas.routes');
const proyectosRoutes = require('./routes/proyectos.routes');
const reunionesRoutes = require('./routes/reuniones.routes');
const seguimientoRoutes = require('./routes/seguimiento.routes');
const accionesRoutes = require('./routes/acciones.routes');
const kpisRoutes = require('./routes/kpis.routes');


const app = express();

const corsOrigin = process.env.CORS_ORIGIN;

app.use(cors({
    origin: corsOrigin
        ? corsOrigin.split(',').map(origin => origin.trim())
        : true
}));
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, '../public')
    )
);

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reuniones', reunionesRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/acciones', accionesRoutes);
app.use('/api/kpis', kpisRoutes);


app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'cpt-backend'
    });
});

module.exports = app;
