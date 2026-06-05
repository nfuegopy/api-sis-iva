-- ============================================================================
-- SISTEMA DE LECTURA Y REGISTRO DE COMPROBANTES IVA
-- Archivo     : schema_bd_sis_iva.sql
-- Base de datos: bd_sis_iva
-- Motor       : MySQL / MariaDB - InnoDB
-- Codificación: utf8mb4
--
-- Objetivo:
--   Script de referencia que refleja EXACTAMENTE las entidades TypeORM activas
--   en la API. Usar para recrear la BD desde cero en un entorno limpio.
--
-- Importante:
--   - synchronize: false en TypeORM — la BD solo cambia con este script.
--   - El seed de menús usa las URLs reales del @RequierePermiso de cada controller.
--   - No incluye tablas SET de catálogos (set_tipo_comprobante, etc.) porque
--     no tienen entidades TypeORM y la API valida esos valores a nivel DTO.
--   - Los campos marcados con "RECOMENDADO AGREGAR" no están en las entidades
--     actuales pero son buenas prácticas para producción.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `bd_sis_iva`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bd_sis_iva`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. MÓDULO GEOGRÁFICO
-- ============================================================================

CREATE TABLE IF NOT EXISTS `paises` (
  `id`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_paises_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `departamentos` (
  `id`      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre`  VARCHAR(100) NOT NULL,
  `pais_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_departamentos_nombre_pais` (`nombre`, `pais_id`),
  KEY `idx_departamentos_pais_id` (`pais_id`),
  CONSTRAINT `fk_departamentos_paises`
    FOREIGN KEY (`pais_id`) REFERENCES `paises` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ciudades` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre`           VARCHAR(100) NOT NULL,
  `departamento_id`  INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ciudades_nombre_departamento` (`nombre`, `departamento_id`),
  KEY `idx_ciudades_departamento_id` (`departamento_id`),
  CONSTRAINT `fk_ciudades_departamentos`
    FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. MÓDULO DE PERSONAS
-- ============================================================================

-- Nota: email_contacto, created_at y updated_at están en el diseño ideal
--       pero no en la entidad TypeORM actual. Agregar cuando se sincronice.
CREATE TABLE IF NOT EXISTS `personas` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre`    VARCHAR(100) NOT NULL,
  `apellido`  VARCHAR(100) NOT NULL,
  `telefono`  VARCHAR(20) NULL,
  `direccion` VARCHAR(255) NULL,
  `ciudad_id` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  KEY `idx_personas_ciudad_id` (`ciudad_id`),
  CONSTRAINT `fk_personas_ciudades`
    FOREIGN KEY (`ciudad_id`) REFERENCES `ciudades` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tipos_documento` (
  `id`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `codigo` VARCHAR(10)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tipos_documento_nombre` (`nombre`),
  UNIQUE KEY `uk_tipos_documento_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- fecha_vencimiento existe en la entidad pero no en el schema original.
CREATE TABLE IF NOT EXISTS `persona_documentos` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `persona_id`       INT UNSIGNED NOT NULL,
  `tipo_documento_id` INT UNSIGNED NOT NULL,
  `numero`           VARCHAR(50) NOT NULL,
  `fecha_vencimiento` DATE NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_persona_tipo_documento` (`persona_id`, `tipo_documento_id`),
  KEY `idx_persona_documentos_tipo_id` (`tipo_documento_id`),
  KEY `idx_persona_documentos_numero` (`numero`),
  CONSTRAINT `fk_documento_persona`
    FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_documento_tipo`
    FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipos_documento` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. MÓDULO DE SEGURIDAD, MENÚ Y PERMISOS
-- ============================================================================

-- Nota: created_at está en el diseño ideal pero no en la entidad Role actual.
CREATE TABLE IF NOT EXISTS `roles` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre`      VARCHAR(50) NOT NULL,
  `descripcion` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: la entidad usa `fecha_creacion` (no `created_at`). Sin updated_at.
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(255) NOT NULL,
  `password`      VARCHAR(255) NOT NULL,
  `persona_id`    INT UNSIGNED NOT NULL,
  `rol_id`        INT UNSIGNED NOT NULL,
  `activo`        BOOLEAN NOT NULL DEFAULT TRUE,
  `es_temporal`   BOOLEAN NOT NULL DEFAULT FALSE,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuarios_email` (`email`),
  KEY `idx_usuarios_persona_id` (`persona_id`),
  KEY `idx_usuarios_rol_id` (`rol_id`),
  CONSTRAINT `fk_usuarios_roles`
    FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_personas`
    FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: la entidad tiene descripcion e icono, no tiene orden ni activo.
CREATE TABLE IF NOT EXISTS `grupo_menu` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre`      VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `icono`       TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_grupo_menu_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: la entidad tiene descripcion e icono, no tiene orden ni activo.
CREATE TABLE IF NOT EXISTS `menu` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre`        VARCHAR(100) NOT NULL,
  `descripcion`   VARCHAR(255) NULL,
  `grupo_menu_id` INT UNSIGNED NOT NULL,
  `url`           VARCHAR(255) NOT NULL,
  `icono`         TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_menu_url` (`url`),
  KEY `idx_menu_grupo_id` (`grupo_menu_id`),
  CONSTRAINT `fk_menu_grupo`
    FOREIGN KEY (`grupo_menu_id`) REFERENCES `grupo_menu` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `menu_rol` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `menu_id`          INT UNSIGNED NOT NULL,
  `rol_id`           INT UNSIGNED NOT NULL,
  `permitir_listar`   BOOLEAN NOT NULL DEFAULT FALSE,
  `permitir_guardar`  BOOLEAN NOT NULL DEFAULT FALSE,
  `permitir_editar`   BOOLEAN NOT NULL DEFAULT FALSE,
  `permitir_eliminar` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_menu_rol` (`menu_id`, `rol_id`),
  KEY `idx_menu_rol_rol_id` (`rol_id`),
  CONSTRAINT `fk_permiso_menu`
    FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_permiso_rol`
    FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CATÁLOGO LOCAL DE RUCs (tabla de referencia SET)
-- ============================================================================

-- Nota: la entidad SetRuc no tiene created_at ni updated_at.
CREATE TABLE IF NOT EXISTS `set_rucs` (
  `ruc`          VARCHAR(15)  NOT NULL,
  `dv`           VARCHAR(1)   NULL,
  `razon_social` VARCHAR(255) NULL,
  `estado`       VARCHAR(50)  NULL,
  PRIMARY KEY (`ruc`),
  KEY `idx_set_rucs_razon_social` (`razon_social`),
  KEY `idx_set_rucs_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. MÓDULO DE NEGOCIO
-- ============================================================================

-- Nota: no tiene activo ni updated_at. UNIQUE solo en persona_id (OneToOne) y ruc.
CREATE TABLE IF NOT EXISTS `contribuyentes` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `persona_id`    INT UNSIGNED NOT NULL,
  `ruc`           VARCHAR(20) NOT NULL,
  `dv`            INT NOT NULL,
  `razon_social`  VARCHAR(255) NOT NULL,
  `tipo_impuesto` ENUM('IVA_GENERAL', 'IRP_RSP', 'IRE_RESIMPLE') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_contribuyentes_persona` (`persona_id`),
  UNIQUE KEY `uk_contribuyentes_ruc` (`ruc`),
  KEY `idx_contribuyentes_razon_social` (`razon_social`),
  CONSTRAINT `fk_contribuyente_persona`
    FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: no tiene created_at en la entidad.
CREATE TABLE IF NOT EXISTS `asignaciones_contables` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id`       INT UNSIGNED NOT NULL,
  `contribuyente_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_contribuyente` (`usuario_id`, `contribuyente_id`),
  KEY `idx_asignaciones_contribuyente_id` (`contribuyente_id`),
  CONSTRAINT `fk_asignacion_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asignacion_contribuyente`
    FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. MÓDULO DE COMPROBANTES DE COMPRAS
-- ============================================================================

-- Nota: nro_comprobante y comprobante_asociado son VARCHAR(15) (entidad).
--       Sin FK a tablas SET (validación a nivel DTO en la API).
--       Sin updated_at. Con revisor_id, fecha_reclamado, tipo_gasto, tipo_papel
--       que son campos de la bolsa de revisión y clasificación IRP.
-- RECOMENDADO AGREGAR manualmente: UNIQUE (contribuyente_id, ruc_emisor, timbrado, nro_comprobante)
CREATE TABLE IF NOT EXISTS `comprobantes` (
  `id`                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `contribuyente_id`     INT UNSIGNED NOT NULL,
  `nro_comprobante`      VARCHAR(15) NOT NULL COMMENT 'Formato: 000-000-0000000',
  `timbrado`             VARCHAR(8)  NOT NULL,
  `ruc_emisor`           VARCHAR(20) NOT NULL,
  `razon_social_emisor`  VARCHAR(255) NOT NULL,
  `fecha_emision`        DATE NOT NULL,
  `gravada_10`           DECIMAL(15,0) NOT NULL DEFAULT 0,
  `gravada_5`            DECIMAL(15,0) NOT NULL DEFAULT 0,
  `exenta`               DECIMAL(15,0) NOT NULL DEFAULT 0,
  `iva_10`               DECIMAL(15,0) NOT NULL DEFAULT 0,
  `iva_5`                DECIMAL(15,0) NOT NULL DEFAULT 0,
  `monto_total`          DECIMAL(15,0) NOT NULL,
  `tipo_comprobante_set` INT NOT NULL DEFAULT 109 COMMENT '109=Factura, 112=Ticket, etc.',
  `condicion_operacion`  INT NOT NULL DEFAULT 1   COMMENT '1=Contado, 2=Crédito',
  `moneda_extranjera`    CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'S/N',
  `imputa_iva`           CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'S/N',
  `imputa_ire`           CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'S/N',
  `imputa_irp`           CHAR(1) NOT NULL DEFAULT 'S' COMMENT 'S/N',
  `no_imputa`            CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'S/N',
  `comprobante_asociado` VARCHAR(15) NULL COMMENT 'Para notas de crédito/débito',
  `timbrado_asociado`    VARCHAR(8)  NULL,
  `revisor_id`           INT UNSIGNED NULL COMMENT 'ID del contador que reclamó la factura (bolsa)',
  `fecha_reclamado`      TIMESTAMP NULL,
  `url_foto_webp`        VARCHAR(255) NULL,
  `tipo_papel`           ENUM('TERMICO','MATRICIAL','PREIMPRESO') NULL,
  `confianza_ocr`        DECIMAL(5,2) NULL,
  `estado_ocr`           ENUM('EN_COLA','PROCESANDO','AUTO_PROCESADO','REQUIERE_REVISION','VERIFICADO_HUMANO','ERROR_PROCESAMIENTO') NULL DEFAULT 'EN_COLA',
  `tipo_gasto`           ENUM('ALIMENTACION','SALUD','EDUCACION','VIVIENDA','VESTIMENTA','ESPARCIMIENTO','CAPACITACION','OTROS') NOT NULL DEFAULT 'OTROS',
  `created_at`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comprobantes_contribuyente_id` (`contribuyente_id`),
  KEY `idx_comprobantes_fecha_emision` (`fecha_emision`),
  KEY `idx_comprobantes_estado_ocr` (`estado_ocr`),
  KEY `idx_comprobantes_ruc_emisor` (`ruc_emisor`),
  CONSTRAINT `fk_comprobantes_contribuyente`
    FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. MÓDULO DE COMPROBANTES DE VENTAS
-- ============================================================================

-- Nota: sin tipo_identificacion_cliente, sin comprobante_asociado/timbrado_asociado.
--       Con revisor_id y fecha_reclamado (bolsa de revisión).
--       nro_comprobante VARCHAR(15). Sin FK a tablas SET.
-- RECOMENDADO AGREGAR manualmente: UNIQUE (contribuyente_id, timbrado, nro_comprobante)
CREATE TABLE IF NOT EXISTS `comprobantes_ventas` (
  `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `contribuyente_id`      INT UNSIGNED NOT NULL,
  `nro_comprobante`       VARCHAR(15) NOT NULL COMMENT 'Formato: 000-000-0000000',
  `timbrado`              VARCHAR(8)  NOT NULL,
  `fecha_emision`         DATE NOT NULL,
  `tipo_comprobante_set`  INT NOT NULL DEFAULT 109,
  `condicion_operacion`   INT NOT NULL DEFAULT 1,
  `ruc_cliente`           VARCHAR(20) NOT NULL,
  `razon_social_cliente`  VARCHAR(255) NOT NULL,
  `gravada_10`            DECIMAL(15,0) NOT NULL DEFAULT 0,
  `gravada_5`             DECIMAL(15,0) NOT NULL DEFAULT 0,
  `exenta`                DECIMAL(15,0) NOT NULL DEFAULT 0,
  `iva_10`                DECIMAL(15,0) NOT NULL DEFAULT 0,
  `iva_5`                 DECIMAL(15,0) NOT NULL DEFAULT 0,
  `monto_total`           DECIMAL(15,0) NOT NULL,
  `moneda_extranjera`     CHAR(1) NOT NULL DEFAULT 'N',
  `imputa_iva`            CHAR(1) NOT NULL DEFAULT 'S',
  `imputa_ire`            CHAR(1) NOT NULL DEFAULT 'N',
  `imputa_irp`            CHAR(1) NOT NULL DEFAULT 'S',
  `revisor_id`            INT UNSIGNED NULL COMMENT 'ID del contador que reclamó la venta (bolsa)',
  `fecha_reclamado`       TIMESTAMP NULL,
  `url_foto_webp`         VARCHAR(255) NULL,
  `estado_ocr`            ENUM('EN_COLA','PROCESANDO','AUTO_PROCESADO','REQUIERE_REVISION','VERIFICADO_HUMANO','ERROR_PROCESAMIENTO') NULL DEFAULT 'EN_COLA',
  `confianza_ocr`         DECIMAL(5,2) NULL,
  `created_at`            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comprobantes_ventas_contribuyente_id` (`contribuyente_id`),
  KEY `idx_comprobantes_ventas_fecha_emision` (`fecha_emision`),
  KEY `idx_comprobantes_ventas_estado_ocr` (`estado_ocr`),
  KEY `idx_comprobantes_ventas_ruc_cliente` (`ruc_cliente`),
  CONSTRAINT `fk_ventas_contribuyente`
    FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. MÓDULO OCR / REVISIÓN HUMANA
-- ============================================================================

CREATE TABLE IF NOT EXISTS `ocr_entrenamientos` (
  `id`                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `comprobante_id`       INT UNSIGNED NULL COMMENT 'Referencia a comprobante de compra',
  `comprobante_venta_id` INT UNSIGNED NULL COMMENT 'Referencia a comprobante de venta',
  `url_imagen`           VARCHAR(255) NOT NULL,
  `json_maquina`         JSON NOT NULL COMMENT 'Resultado OCR/regex/IA',
  `json_humano`          JSON NULL     COMMENT 'Corrección humana',
  `estado_entrenamiento` ENUM('PENDIENTE','LISTO_PARA_ENTRENAR','ENTRENADO','DESCARTADO') NOT NULL DEFAULT 'PENDIENTE',
  `fecha_creacion`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ocr_comprobante_compra` (`comprobante_id`),
  UNIQUE KEY `uk_ocr_comprobante_venta` (`comprobante_venta_id`),
  KEY `idx_ocr_estado_entrenamiento` (`estado_entrenamiento`),
  CONSTRAINT `fk_ocr_comprobante`
    FOREIGN KEY (`comprobante_id`) REFERENCES `comprobantes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ocr_ventas`
    FOREIGN KEY (`comprobante_venta_id`) REFERENCES `comprobantes_ventas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_ocr_al_menos_un_comprobante`
    CHECK (`comprobante_id` IS NOT NULL OR `comprobante_venta_id` IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. MÓDULO DE COBRANZAS SAAS
-- ============================================================================

-- Nota: la entidad no tiene created_at ni updated_at.
CREATE TABLE IF NOT EXISTS `suscripciones` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `contribuyente_id` INT UNSIGNED NOT NULL,
  `estado`           ENUM('ACTIVO','MOROSO','CANCELADO') NOT NULL DEFAULT 'ACTIVO',
  `fecha_inicio`     DATE NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_suscripciones_contribuyente_id` (`contribuyente_id`),
  KEY `idx_suscripciones_estado` (`estado`),
  CONSTRAINT `fk_suscripciones_contribuyente`
    FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: la entidad no tiene created_at ni updated_at.
CREATE TABLE IF NOT EXISTS `cuotas_pagos` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `suscripcion_id`   INT UNSIGNED NOT NULL,
  `monto`            DECIMAL(15,0) NOT NULL,
  `fecha_vencimiento` DATE NOT NULL,
  `fecha_pago`       DATE NULL,
  `estado`           ENUM('PENDIENTE','PAGADO','VENCIDO') NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id`),
  KEY `idx_cuotas_suscripcion_id` (`suscripcion_id`),
  KEY `idx_cuotas_estado` (`estado`),
  KEY `idx_cuotas_fecha_vencimiento` (`fecha_vencimiento`),
  CONSTRAINT `fk_cuotas_suscripcion`
    FOREIGN KEY (`suscripcion_id`) REFERENCES `suscripciones` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. CARGA INICIAL
-- ============================================================================

-- Geografía mínima Paraguay.
INSERT INTO `paises` (`id`, `nombre`) VALUES (1, 'Paraguay')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `departamentos` (`id`, `nombre`, `pais_id`) VALUES
  (1, 'Central', 1),
  (2, 'Asunción', 1)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `pais_id` = VALUES(`pais_id`);

INSERT INTO `ciudades` (`id`, `nombre`, `departamento_id`) VALUES
  (1, 'Luque', 1),
  (2, 'Fernando de la Mora', 1),
  (3, 'Asunción', 2)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `departamento_id` = VALUES(`departamento_id`);

-- Tipos de documento.
INSERT INTO `tipos_documento` (`id`, `nombre`, `codigo`) VALUES
  (1, 'Cédula de Identidad',               'CI'),
  (2, 'Registro Único de Contribuyente',   'RUC'),
  (3, 'Pasaporte',                         'PAS'),
  (4, 'Cédula Extranjera',                 'CE')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `codigo` = VALUES(`codigo`);

-- Roles del sistema.
INSERT INTO `roles` (`id`, `nombre`, `descripcion`) VALUES
  (1, 'Administrador', 'Acceso total y configuración del sistema.'),
  (2, 'Contador',      'Rol operativo para registrar, revisar y validar comprobantes.'),
  (3, 'Solo Lectura',  'Rol de consulta sin permisos de modificación.')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `descripcion` = VALUES(`descripcion`);

-- Grupos de menú (reflejan los creados vía API).
INSERT INTO `grupo_menu` (`id`, `nombre`) VALUES
  (1, 'Negocio'),
  (2, 'Seguridad'),
  (3, 'Cobranzas'),
  (4, 'Gestión'),
  (5, 'Referenciales')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Menús con URLs exactas usadas en @RequierePermiso de cada controller.
-- IMPORTANTE: modificar estas URLs rompe el MenuRolGuard.
INSERT INTO `menu` (`id`, `nombre`, `grupo_menu_id`, `url`, `icono`) VALUES
  ( 1, 'Comprobantes',              1, '/negocio/comprobantes',            'receipt'),
  ( 2, 'Contribuyentes',            1, '/negocio/contribuyentes',          'business'),
  ( 3, 'Exportaciones RG90',        1, '/negocio/exportaciones',           'download'),
  ( 4, 'OCR - Extraer Comprobante', 1, '/ocr-tax',                         'document_scanner'),
  ( 5, 'Asignaciones Contables',    1, '/negocio/asignaciones-contables',  'assignment_ind'),
  ( 6, 'Usuarios',                  2, '/usuarios',                        'people'),
  ( 7, 'Roles',                     2, '/roles',                           'admin_panel_settings'),
  ( 8, 'Menú',                      2, '/menu',                            'menu'),
  ( 9, 'Grupos de Menú',            2, '/grupo-menu',                      'folder'),
  (10, 'Permisos',                  2, '/menu-rol',                        'lock'),
  (11, 'Suscripciones',             3, '/cobranzas/suscripciones',         'subscriptions'),
  (12, 'Cuotas y Pagos',            3, '/cobranzas/cuotas-pagos',          'payments'),
  (13, 'Personas',                  4, '/personas',                        'person'),
  (14, 'Documentos de Personas',    4, '/persona-documentos',              'badge'),
  (15, 'Tipos de Documento',        5, '/tipos-documento',                 'description'),
  (16, 'Países',                    5, '/pais',                            'public'),
  (17, 'Comprobantes de Venta',     1, '/negocio/comprobantes-ventas',     'receipt_long')
ON DUPLICATE KEY UPDATE
  `nombre`        = VALUES(`nombre`),
  `grupo_menu_id` = VALUES(`grupo_menu_id`),
  `url`           = VALUES(`url`),
  `icono`         = VALUES(`icono`);

-- Permisos del Administrador: acceso total (LGED) en los 17 menús.
INSERT INTO `menu_rol` (`menu_id`, `rol_id`, `permitir_listar`, `permitir_guardar`, `permitir_editar`, `permitir_eliminar`) VALUES
  ( 1, 1, TRUE, TRUE, TRUE, TRUE),
  ( 2, 1, TRUE, TRUE, TRUE, TRUE),
  ( 3, 1, TRUE, TRUE, TRUE, TRUE),
  ( 4, 1, TRUE, TRUE, TRUE, TRUE),
  ( 5, 1, TRUE, TRUE, TRUE, TRUE),
  ( 6, 1, TRUE, TRUE, TRUE, TRUE),
  ( 7, 1, TRUE, TRUE, TRUE, TRUE),
  ( 8, 1, TRUE, TRUE, TRUE, TRUE),
  ( 9, 1, TRUE, TRUE, TRUE, TRUE),
  (10, 1, TRUE, TRUE, TRUE, TRUE),
  (11, 1, TRUE, TRUE, TRUE, TRUE),
  (12, 1, TRUE, TRUE, TRUE, TRUE),
  (13, 1, TRUE, TRUE, TRUE, TRUE),
  (14, 1, TRUE, TRUE, TRUE, TRUE),
  (15, 1, TRUE, TRUE, TRUE, TRUE),
  (16, 1, TRUE, TRUE, TRUE, TRUE),
  (17, 1, TRUE, TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE
  `permitir_listar`   = VALUES(`permitir_listar`),
  `permitir_guardar`  = VALUES(`permitir_guardar`),
  `permitir_editar`   = VALUES(`permitir_editar`),
  `permitir_eliminar` = VALUES(`permitir_eliminar`);

-- Permisos del Contador: acceso operativo en 12 menús.
INSERT INTO `menu_rol` (`menu_id`, `rol_id`, `permitir_listar`, `permitir_guardar`, `permitir_editar`, `permitir_eliminar`) VALUES
  ( 1, 2, TRUE,  TRUE,  TRUE,  FALSE),  -- Comprobantes: L/G/E, sin borrar
  ( 2, 2, TRUE,  FALSE, FALSE, FALSE),  -- Contribuyentes: solo ver
  ( 3, 2, TRUE,  FALSE, FALSE, FALSE),  -- Exportaciones: solo descargar
  ( 4, 2, FALSE, TRUE,  FALSE, FALSE),  -- OCR: solo subir imágenes
  ( 5, 2, TRUE,  FALSE, FALSE, FALSE),  -- Asignaciones: solo ver
  (11, 2, TRUE,  FALSE, FALSE, FALSE),  -- Suscripciones: solo ver
  (12, 2, TRUE,  FALSE, FALSE, FALSE),  -- Cuotas: solo ver
  (13, 2, TRUE,  TRUE,  TRUE,  FALSE),  -- Personas: L/G/E
  (14, 2, TRUE,  TRUE,  TRUE,  FALSE),  -- Docs personas: L/G/E
  (15, 2, TRUE,  FALSE, FALSE, FALSE),  -- Tipos doc: solo ver
  (16, 2, TRUE,  FALSE, FALSE, FALSE),  -- Países: solo ver
  (17, 2, TRUE,  FALSE, TRUE,  FALSE)   -- Ventas: L/E (editar correcciones OCR)
ON DUPLICATE KEY UPDATE
  `permitir_listar`   = VALUES(`permitir_listar`),
  `permitir_guardar`  = VALUES(`permitir_guardar`),
  `permitir_editar`   = VALUES(`permitir_editar`),
  `permitir_eliminar` = VALUES(`permitir_eliminar`);

-- Permisos de Solo Lectura: solo consulta en menús de negocio.
INSERT INTO `menu_rol` (`menu_id`, `rol_id`, `permitir_listar`, `permitir_guardar`, `permitir_editar`, `permitir_eliminar`) VALUES
  ( 1, 3, TRUE, FALSE, FALSE, FALSE),
  ( 2, 3, TRUE, FALSE, FALSE, FALSE),
  ( 3, 3, TRUE, FALSE, FALSE, FALSE),
  ( 5, 3, TRUE, FALSE, FALSE, FALSE),
  (11, 3, TRUE, FALSE, FALSE, FALSE),
  (12, 3, TRUE, FALSE, FALSE, FALSE),
  (13, 3, TRUE, FALSE, FALSE, FALSE),
  (17, 3, TRUE, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE
  `permitir_listar`   = VALUES(`permitir_listar`),
  `permitir_guardar`  = VALUES(`permitir_guardar`),
  `permitir_editar`   = VALUES(`permitir_editar`),
  `permitir_eliminar` = VALUES(`permitir_eliminar`);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
