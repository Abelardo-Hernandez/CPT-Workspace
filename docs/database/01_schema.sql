-- ============================================================
-- PTC Workspace - Database Schema
-- Archivo: 01_schema.sql
-- Uso: estructura limpia para despliegue inicial
-- Base origen: dashboard_ptc
-- ============================================================

CREATE DATABASE IF NOT EXISTS dashboard_ptc
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE dashboard_ptc;

-- ============================================================
-- TABLA: areas
-- Catálogo de áreas/departamentos
-- ============================================================
CREATE TABLE IF NOT EXISTS areas (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_areas_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: usuarios
-- Usuarios del sistema y roles de acceso
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('administrador','colaborador','consulta') NOT NULL,
    area_id INT DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(150) DEFAULT NULL,
    ultimo_acceso DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_usuario (usuario),
    KEY idx_usuarios_area_id (area_id),
    KEY idx_usuarios_rol (rol),
    CONSTRAINT fk_usuarios_area
        FOREIGN KEY (area_id) REFERENCES areas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: reuniones
-- Reuniones de seguimiento
-- ============================================================
CREATE TABLE IF NOT EXISTS reuniones (
    id INT NOT NULL AUTO_INCREMENT,
    numero_reunion INT NOT NULL,
    fecha_reunion DATE NOT NULL,
    tema_habilidad_blanda VARCHAR(255) DEFAULT NULL,
    fecha_proxima_reunion DATE DEFAULT NULL,
    hora_proxima_reunion TIME DEFAULT NULL,
    creada_por INT DEFAULT NULL,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    estatus ENUM('abierta','cerrada','programada','activa','finalizada','cancelada') DEFAULT 'abierta',
    PRIMARY KEY (id),
    KEY idx_reuniones_creada_por (creada_por),
    KEY idx_reuniones_fecha_reunion (fecha_reunion),
    KEY idx_reuniones_estatus (estatus),
    CONSTRAINT fk_reuniones_usuario
        FOREIGN KEY (creada_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: proyectos
-- Proyectos registrados en PTC Workspace
-- ============================================================
CREATE TABLE IF NOT EXISTS proyectos (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    area_id INT NOT NULL,
    responsable_usuario_id INT DEFAULT NULL,
    objetivo TEXT,
    fecha_inicio DATE DEFAULT NULL,
    fecha_objetivo DATE DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_proyectos_area_id (area_id),
    KEY idx_proyectos_responsable_usuario_id (responsable_usuario_id),
    KEY idx_proyectos_fecha_objetivo (fecha_objetivo),
    KEY idx_proyectos_activo (activo),
    CONSTRAINT fk_proyectos_area
        FOREIGN KEY (area_id) REFERENCES areas(id),
    CONSTRAINT fk_proyectos_responsable
        FOREIGN KEY (responsable_usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: kpis
-- Catálogo de indicadores KPI
-- ============================================================
CREATE TABLE IF NOT EXISTS kpis (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    unidad VARCHAR(30) DEFAULT NULL,
    tipo_meta ENUM('mayor_es_mejor','menor_es_mejor') NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_kpis_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: acciones
-- Actividades/compromisos de proyecto. Fuente principal del avance.
-- Avance proyecto = acciones terminadas / acciones totales.
-- ============================================================
CREATE TABLE IF NOT EXISTS acciones (
    id INT NOT NULL AUTO_INCREMENT,
    reunion_id INT NOT NULL,
    proyecto_id INT DEFAULT NULL,
    descripcion TEXT NOT NULL,
    responsable_usuario_id INT NOT NULL,
    fecha_compromiso DATE DEFAULT NULL,
    prioridad ENUM('alta','media','baja') DEFAULT 'media',
    estatus ENUM('pendiente','en_proceso','terminada','vencida') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_acciones_reunion_id (reunion_id),
    KEY idx_acciones_proyecto_id (proyecto_id),
    KEY idx_acciones_responsable_usuario_id (responsable_usuario_id),
    KEY idx_acciones_fecha_compromiso (fecha_compromiso),
    KEY idx_acciones_estatus (estatus),
    KEY idx_acciones_prioridad (prioridad),
    CONSTRAINT fk_acciones_reunion
        FOREIGN KEY (reunion_id) REFERENCES reuniones(id),
    CONSTRAINT fk_acciones_proyecto
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
    CONSTRAINT fk_acciones_responsable
        FOREIGN KEY (responsable_usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: accion_seguimiento
-- Comentarios/historial sobre acciones
-- ============================================================
CREATE TABLE IF NOT EXISTS accion_seguimiento (
    id INT NOT NULL AUTO_INCREMENT,
    accion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    comentario TEXT,
    fecha TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_accion_seguimiento_accion_id (accion_id),
    KEY idx_accion_seguimiento_usuario_id (usuario_id),
    KEY idx_accion_seguimiento_fecha (fecha),
    CONSTRAINT fk_accion_seguimiento_accion
        FOREIGN KEY (accion_id) REFERENCES acciones(id),
    CONSTRAINT fk_accion_seguimiento_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: avances_destacados
-- Avances relevantes tratados en reunión
-- ============================================================
CREATE TABLE IF NOT EXISTS avances_destacados (
    id INT NOT NULL AUTO_INCREMENT,
    reunion_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_avances_destacados_reunion_id (reunion_id),
    CONSTRAINT fk_avances_destacados_reunion
        FOREIGN KEY (reunion_id) REFERENCES reuniones(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: bloqueos
-- Bloqueos detectados en reunión
-- ============================================================
CREATE TABLE IF NOT EXISTS bloqueos (
    id INT NOT NULL AUTO_INCREMENT,
    reunion_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_bloqueos_reunion_id (reunion_id),
    CONSTRAINT fk_bloqueos_reunion
        FOREIGN KEY (reunion_id) REFERENCES reuniones(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: proyecto_kpis
-- Relación muchos a muchos entre proyectos y KPIs
-- ============================================================
CREATE TABLE IF NOT EXISTS proyecto_kpis (
    proyecto_id INT NOT NULL,
    kpi_id INT NOT NULL,
    PRIMARY KEY (proyecto_id, kpi_id),
    KEY idx_proyecto_kpis_kpi_id (kpi_id),
    CONSTRAINT fk_proyecto_kpis_proyecto
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
    CONSTRAINT fk_proyecto_kpis_kpi
        FOREIGN KEY (kpi_id) REFERENCES kpis(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: proyecto_seguimiento
-- Historial/comentarios de seguimiento por proyecto y reunión.
-- Nota: el avance oficial del proyecto se calcula desde acciones.
-- ============================================================
CREATE TABLE IF NOT EXISTS proyecto_seguimiento (
    id INT NOT NULL AUTO_INCREMENT,
    proyecto_id INT NOT NULL,
    reunion_id INT NOT NULL,
    avance INT DEFAULT 0,
    estatus ENUM('en_tiempo','en_riesgo','atrasado','completado') DEFAULT NULL,
    comentario TEXT,
    fecha_registro TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_proyecto_seguimiento_proyecto_id (proyecto_id),
    KEY idx_proyecto_seguimiento_reunion_id (reunion_id),
    KEY idx_proyecto_seguimiento_fecha_registro (fecha_registro),
    CONSTRAINT fk_proyecto_seguimiento_proyecto
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
    CONSTRAINT fk_proyecto_seguimiento_reunion
        FOREIGN KEY (reunion_id) REFERENCES reuniones(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: kpi_resultados
-- Resultados KPI por reunión/proyecto
-- ============================================================
CREATE TABLE IF NOT EXISTS kpi_resultados (
    id INT NOT NULL AUTO_INCREMENT,
    reunion_id INT DEFAULT NULL,
    proyecto_id INT DEFAULT NULL,
    kpi_id INT NOT NULL,
    meta DECIMAL(10,2) DEFAULT NULL,
    actual DECIMAL(10,2) DEFAULT NULL,
    resultado ENUM('cumple','riesgo','no_cumple') DEFAULT NULL,
    tendencia ENUM('sube','baja','igual') DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_kpi_resultados_reunion_id (reunion_id),
    KEY idx_kpi_resultados_proyecto_id (proyecto_id),
    KEY idx_kpi_resultados_kpi_id (kpi_id),
    KEY idx_kpi_resultados_resultado (resultado),
    CONSTRAINT fk_kpi_resultados_reunion
        FOREIGN KEY (reunion_id) REFERENCES reuniones(id),
    CONSTRAINT fk_kpi_resultados_proyecto
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
    CONSTRAINT fk_kpi_resultados_kpi
        FOREIGN KEY (kpi_id) REFERENCES kpis(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
