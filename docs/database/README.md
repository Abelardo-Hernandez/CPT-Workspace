# Base de datos - PTC Workspace

## Archivos

- `01_schema.sql`: estructura limpia de la base de datos.
- `04_seed.sql`: datos mínimos iniciales.

## Instalación local

```bash
mysql -u root -p < 01_schema.sql
mysql -u root -p < 04_seed.sql
```

## Notas

- El avance oficial del proyecto se calcula desde `acciones`:
  `acciones terminadas / acciones totales * 100`.
- `proyecto_seguimiento` queda como historial/comentarios de reuniones.
- Antes de producción, cambia la contraseña inicial del usuario `admin`.
