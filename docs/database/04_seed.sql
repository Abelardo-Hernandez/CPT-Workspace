-- ============================================================
-- PTC Workspace - Seed inicial
-- Archivo: 04_seed.sql
-- Nota: cambia la contrasena inicial del usuario admin antes de produccion.
-- ============================================================

USE dashboard_ptc;

-- Area base
INSERT INTO areas (nombre)
VALUES ('General')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Usuario administrador inicial
-- IMPORTANTE: cambia esta contrasena inicial antes de produccion.
-- Ejemplo usuario: admin
INSERT INTO usuarios (nombre, usuario, password, rol, area_id, email)
SELECT
    'Administrador',
    'admin',
    '$2b$10$mHEPCLUaBVAapKSXUrk70.C9UxMKbsqKDqwNTsHVRULg9HgEPWabe',
    'administrador',
    a.id,
    NULL
FROM areas a
WHERE a.nombre = 'General'
AND NOT EXISTS (
    SELECT 1 FROM usuarios u WHERE u.usuario = 'admin'
);

-- KPI iniciales sugeridos
INSERT INTO kpis (nombre, unidad, tipo_meta)
SELECT 'Calidad', '%', 'mayor_es_mejor'
WHERE NOT EXISTS (SELECT 1 FROM kpis WHERE nombre = 'Calidad');

INSERT INTO kpis (nombre, unidad, tipo_meta)
SELECT 'Productividad', '%', 'mayor_es_mejor'
WHERE NOT EXISTS (SELECT 1 FROM kpis WHERE nombre = 'Productividad');

INSERT INTO kpis (nombre, unidad, tipo_meta)
SELECT 'Scrap', '%', 'menor_es_mejor'
WHERE NOT EXISTS (SELECT 1 FROM kpis WHERE nombre = 'Scrap');

INSERT INTO kpis (nombre, unidad, tipo_meta)
SELECT 'Seguridad', '%', 'mayor_es_mejor'
WHERE NOT EXISTS (SELECT 1 FROM kpis WHERE nombre = 'Seguridad');
