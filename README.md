# Project Dashboard PTC

Aplicacion web para seguimiento de proyectos, reuniones, acciones, usuarios, areas y KPIs.

## Estructura

```text
backend/
  public/        Vistas HTML, CSS y JavaScript servidas por Express
  scripts/       Utilidades manuales del proyecto
  src/
    config/      Conexion a base de datos
    controllers/ Controladores HTTP
    middleware/  Middlewares de autenticacion/autorizacion
    routes/      Rutas de API
    services/    Logica de negocio reutilizable
docs/
  database/      Scripts o respaldos SQL de referencia
archive/
  legacy-frontend/ Frontend anterior conservado como referencia
  dev/             Archivos de prueba o desarrollo no conectados a la app
```

## Ejecutar

```bash
cd backend
npm install
npm start
```

La app queda disponible en `http://127.0.0.1:3000`.

