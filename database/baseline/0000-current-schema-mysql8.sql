-- Baseline Database Schema
-- Motor fuente: MySQL 8.0.44
-- Base fuente: bd_sis_iva local

SET FOREIGN_KEY_CHECKS=0;

-- Table: asignaciones_contables
CREATE TABLE `asignaciones_contables` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `contribuyente_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_contribuyente` (`usuario_id`,`contribuyente_id`),
  KEY `idx_asignaciones_contribuyente_id` (`contribuyente_id`),
  CONSTRAINT `fk_asignacion_contribuyente` FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asignacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ciudades
CREATE TABLE `ciudades` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departamento_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ciudades_nombre_departamento` (`nombre`,`departamento_id`),
  KEY `idx_ciudades_departamento_id` (`departamento_id`),
  CONSTRAINT `fk_ciudades_departamentos` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: comprobantes
CREATE TABLE `comprobantes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `contribuyente_id` int unsigned NOT NULL,
  `nro_comprobante` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Formato: 000-000-0000000',
  `timbrado` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruc_emisor` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `razon_social_emisor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_emision` date NOT NULL,
  `gravada_10` decimal(15,0) NOT NULL DEFAULT '0',
  `gravada_5` decimal(15,0) NOT NULL DEFAULT '0',
  `exenta` decimal(15,0) NOT NULL DEFAULT '0',
  `iva_10` decimal(15,0) NOT NULL DEFAULT '0',
  `iva_5` decimal(15,0) NOT NULL DEFAULT '0',
  `monto_total` decimal(15,0) NOT NULL,
  `tipo_comprobante_set` int NOT NULL DEFAULT '109' COMMENT '109=Factura, 112=Ticket, etc.',
  `condicion_operacion` int NOT NULL DEFAULT '1' COMMENT '1=Contado, 2=Crédito',
  `moneda_extranjera` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'S/N',
  `imputa_iva` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'S' COMMENT 'S/N',
  `imputa_ire` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'S/N',
  `imputa_irp` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'S' COMMENT 'S/N',
  `no_imputa` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'S/N',
  `comprobante_asociado` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Para notas de crédito/débito',
  `timbrado_asociado` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revisor_id` int unsigned DEFAULT NULL COMMENT 'ID del contador que reclamó la factura (bolsa)',
  `fecha_reclamado` timestamp NULL DEFAULT NULL,
  `url_foto_webp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_papel` enum('TERMICO','MATRICIAL','PREIMPRESO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confianza_ocr` decimal(5,2) DEFAULT NULL,
  `estado_ocr` enum('EN_COLA','PROCESANDO','AUTO_PROCESADO','REQUIERE_REVISION','VERIFICADO_HUMANO','ERROR_PROCESAMIENTO') COLLATE utf8mb4_unicode_ci DEFAULT 'EN_COLA',
  `tipo_gasto` enum('ALIMENTACION','SALUD','EDUCACION','VIVIENDA','VESTIMENTA','ESPARCIMIENTO','CAPACITACION','OTROS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OTROS',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete — NULL = activo',
  PRIMARY KEY (`id`),
  KEY `idx_comprobantes_contribuyente_id` (`contribuyente_id`),
  KEY `idx_comprobantes_fecha_emision` (`fecha_emision`),
  KEY `idx_comprobantes_estado_ocr` (`estado_ocr`),
  KEY `idx_comprobantes_ruc_emisor` (`ruc_emisor`),
  CONSTRAINT `fk_comprobantes_contribuyente` FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: comprobantes_ventas
CREATE TABLE `comprobantes_ventas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `contribuyente_id` int unsigned NOT NULL,
  `nro_comprobante` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Formato: 000-000-0000000',
  `timbrado` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_emision` date NOT NULL,
  `tipo_comprobante_set` int NOT NULL DEFAULT '109',
  `condicion_operacion` int NOT NULL DEFAULT '1',
  `ruc_cliente` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `razon_social_cliente` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gravada_10` decimal(15,0) NOT NULL DEFAULT '0',
  `gravada_5` decimal(15,0) NOT NULL DEFAULT '0',
  `exenta` decimal(15,0) NOT NULL DEFAULT '0',
  `iva_10` decimal(15,0) NOT NULL DEFAULT '0',
  `iva_5` decimal(15,0) NOT NULL DEFAULT '0',
  `monto_total` decimal(15,0) NOT NULL,
  `moneda_extranjera` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N',
  `imputa_iva` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'S',
  `imputa_ire` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N',
  `imputa_irp` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'S',
  `revisor_id` int unsigned DEFAULT NULL COMMENT 'ID del contador que reclamó la venta (bolsa)',
  `fecha_reclamado` timestamp NULL DEFAULT NULL,
  `url_foto_webp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_ocr` enum('EN_COLA','PROCESANDO','AUTO_PROCESADO','REQUIERE_REVISION','VERIFICADO_HUMANO','ERROR_PROCESAMIENTO') COLLATE utf8mb4_unicode_ci DEFAULT 'EN_COLA',
  `confianza_ocr` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete — NULL = activo',
  PRIMARY KEY (`id`),
  KEY `idx_comprobantes_ventas_contribuyente_id` (`contribuyente_id`),
  KEY `idx_comprobantes_ventas_fecha_emision` (`fecha_emision`),
  KEY `idx_comprobantes_ventas_estado_ocr` (`estado_ocr`),
  KEY `idx_comprobantes_ventas_ruc_cliente` (`ruc_cliente`),
  CONSTRAINT `fk_ventas_contribuyente` FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: contribuyentes
CREATE TABLE `contribuyentes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `persona_id` int unsigned NOT NULL,
  `ruc` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dv` int NOT NULL,
  `razon_social` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_impuesto` enum('IVA_GENERAL','IRP_RSP','IRE_RESIMPLE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete — NULL = activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_contribuyentes_persona` (`persona_id`),
  UNIQUE KEY `uk_contribuyentes_ruc` (`ruc`),
  KEY `idx_contribuyentes_razon_social` (`razon_social`),
  CONSTRAINT `fk_contribuyente_persona` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: cuotas_pagos
CREATE TABLE `cuotas_pagos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `suscripcion_id` int unsigned NOT NULL,
  `monto` decimal(15,0) NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `fecha_pago` date DEFAULT NULL,
  `estado` enum('PENDIENTE','PAGADO','VENCIDO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id`),
  KEY `idx_cuotas_suscripcion_id` (`suscripcion_id`),
  KEY `idx_cuotas_estado` (`estado`),
  KEY `idx_cuotas_fecha_vencimiento` (`fecha_vencimiento`),
  CONSTRAINT `fk_cuotas_suscripcion` FOREIGN KEY (`suscripcion_id`) REFERENCES `suscripciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: departamentos
CREATE TABLE `departamentos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pais_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_departamentos_nombre_pais` (`nombre`,`pais_id`),
  KEY `idx_departamentos_pais_id` (`pais_id`),
  CONSTRAINT `fk_departamentos_paises` FOREIGN KEY (`pais_id`) REFERENCES `paises` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: grupo_menu
CREATE TABLE `grupo_menu` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icono` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_grupo_menu_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: menu
CREATE TABLE `menu` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grupo_menu_id` int unsigned NOT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icono` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_menu_url` (`url`),
  KEY `idx_menu_grupo_id` (`grupo_menu_id`),
  CONSTRAINT `fk_menu_grupo` FOREIGN KEY (`grupo_menu_id`) REFERENCES `grupo_menu` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: menu_rol
CREATE TABLE `menu_rol` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `menu_id` int unsigned NOT NULL,
  `rol_id` int unsigned NOT NULL,
  `permitir_listar` tinyint(1) NOT NULL DEFAULT '0',
  `permitir_guardar` tinyint(1) NOT NULL DEFAULT '0',
  `permitir_editar` tinyint(1) NOT NULL DEFAULT '0',
  `permitir_eliminar` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_menu_rol` (`menu_id`,`rol_id`),
  KEY `idx_menu_rol_rol_id` (`rol_id`),
  CONSTRAINT `fk_permiso_menu` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_permiso_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ocr_entrenamientos
CREATE TABLE `ocr_entrenamientos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `comprobante_id` int unsigned DEFAULT NULL COMMENT 'Referencia a comprobante de compra',
  `comprobante_venta_id` int unsigned DEFAULT NULL COMMENT 'Referencia a comprobante de venta',
  `url_imagen` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `json_maquina` json NOT NULL COMMENT 'Resultado OCR/regex/IA',
  `json_humano` json DEFAULT NULL COMMENT 'Corrección humana',
  `estado_entrenamiento` enum('PENDIENTE','LISTO_PARA_ENTRENAR','ENTRENADO','DESCARTADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ocr_comprobante_compra` (`comprobante_id`),
  UNIQUE KEY `uk_ocr_comprobante_venta` (`comprobante_venta_id`),
  KEY `idx_ocr_estado_entrenamiento` (`estado_entrenamiento`),
  CONSTRAINT `fk_ocr_comprobante` FOREIGN KEY (`comprobante_id`) REFERENCES `comprobantes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ocr_ventas` FOREIGN KEY (`comprobante_venta_id`) REFERENCES `comprobantes_ventas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: paises
CREATE TABLE `paises` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_paises_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: password_reset_tokens
CREATE TABLE `password_reset_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expira_en` timestamp NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`),
  KEY `idx_reset_usuario_id` (`usuario_id`),
  CONSTRAINT `fk_reset_token_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: persona_documentos
CREATE TABLE `persona_documentos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `persona_id` int unsigned NOT NULL,
  `tipo_documento_id` int unsigned NOT NULL,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_persona_tipo_documento` (`persona_id`,`tipo_documento_id`),
  KEY `idx_persona_documentos_tipo_id` (`tipo_documento_id`),
  KEY `idx_persona_documentos_numero` (`numero`),
  CONSTRAINT `fk_documento_persona` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_documento_tipo` FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipos_documento` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: personas
CREATE TABLE `personas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ciudad_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_personas_ciudad_id` (`ciudad_id`),
  CONSTRAINT `fk_personas_ciudades` FOREIGN KEY (`ciudad_id`) REFERENCES `ciudades` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: refresh_tokens
CREATE TABLE `refresh_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expira_en` timestamp NOT NULL,
  `revocado` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refresh_token` (`token`),
  KEY `idx_refresh_usuario_id` (`usuario_id`),
  CONSTRAINT `fk_refresh_token_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: roles
CREATE TABLE `roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: set_rucs
CREATE TABLE `set_rucs` (
  `ruc` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dv` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razon_social` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ruc`),
  KEY `idx_set_rucs_razon_social` (`razon_social`),
  KEY `idx_set_rucs_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: suscripciones
CREATE TABLE `suscripciones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `contribuyente_id` int unsigned NOT NULL,
  `estado` enum('ACTIVO','MOROSO','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVO',
  `fecha_inicio` date NOT NULL,
  `es_trial` tinyint(1) NOT NULL DEFAULT '0',
  `trial_hasta` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_suscripciones_contribuyente_id` (`contribuyente_id`),
  KEY `idx_suscripciones_estado` (`estado`),
  CONSTRAINT `fk_suscripciones_contribuyente` FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: tipos_documento
CREATE TABLE `tipos_documento` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tipos_documento_nombre` (`nombre`),
  UNIQUE KEY `uk_tipos_documento_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: usuarios
CREATE TABLE `usuarios` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `persona_id` int unsigned NOT NULL,
  `rol_id` int unsigned NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `es_temporal` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuarios_email` (`email`),
  KEY `idx_usuarios_persona_id` (`persona_id`),
  KEY `idx_usuarios_rol_id` (`rol_id`),
  CONSTRAINT `fk_usuarios_personas` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
