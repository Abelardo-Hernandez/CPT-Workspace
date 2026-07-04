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
```

## Ejecutar

```bash
cd backend
npm install
npm start
```

La app queda disponible en `http://127.0.0.1:3000`.

## Despliegue

El directorio que se debe desplegar es `backend/`.

Variables requeridas:

```text
PORT
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
DB_PORT
JWT_SECRET
CORS_ORIGIN
```

Usa `backend/.env.example` como plantilla. En produccion configura `JWT_SECRET` con un valor largo y privado.

Antes de iniciar en un ambiente nuevo, crea la base de datos con:

```bash
mysql -u root -p < ../docs/database/01_schema.sql
mysql -u root -p < ../docs/database/04_seed.sql
```

Cambia la contraseña inicial del usuario `admin` antes de usar la app en produccion.

Comandos sugeridos en la plataforma:

```bash
npm install
npm start
```

Health check:

```text
/health
```
