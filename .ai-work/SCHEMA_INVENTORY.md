# Inventario Detallado del Schema (Baseline P0.6a)

*Motor local real: MySQL 8.0.44*

## Tabla: `asignaciones_contables`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `usuario_id`: int unsigned NOT NULL
- `contribuyente_id`: int unsigned NOT NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_usuario_contribuyente` (`usuario_id`,`contribuyente_id`)
- **KEY**: KEY `idx_asignaciones_contribuyente_id` (`contribuyente_id`)
- **FK**: CONSTRAINT `fk_asignacion_contribuyente` FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
- **FK**: CONSTRAINT `fk_asignacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `ciudades`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `nombre`: varchar(100) NOT NULL
- `departamento_id`: int unsigned NOT NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_ciudades_nombre_departamento` (`nombre`,`departamento_id`)
- **KEY**: KEY `idx_ciudades_departamento_id` (`departamento_id`)
- **FK**: CONSTRAINT `fk_ciudades_departamentos` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE

---

## Tabla: `comprobantes`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `contribuyente_id`: int unsigned NOT NULL
- `nro_comprobante`: varchar(15) NOT NULL
- `timbrado`: varchar(8) NOT NULL
- `ruc_emisor`: varchar(20) NOT NULL
- `razon_social_emisor`: varchar(255) NOT NULL
- `fecha_emision`: date NOT NULL
- `gravada_10`: decimal(15,0) NOT NULL DEFAULT 0
- `gravada_5`: decimal(15,0) NOT NULL DEFAULT 0
- `exenta`: decimal(15,0) NOT NULL DEFAULT 0
- `iva_10`: decimal(15,0) NOT NULL DEFAULT 0
- `iva_5`: decimal(15,0) NOT NULL DEFAULT 0
- `monto_total`: decimal(15,0) NOT NULL
- `tipo_comprobante_set`: int NOT NULL DEFAULT 109
- `condicion_operacion`: int NOT NULL DEFAULT 1
- `moneda_extranjera`: char(1) NOT NULL DEFAULT N
- `imputa_iva`: char(1) NOT NULL DEFAULT S
- `imputa_ire`: char(1) NOT NULL DEFAULT N
- `imputa_irp`: char(1) NOT NULL DEFAULT S
- `no_imputa`: char(1) NOT NULL DEFAULT N
- `comprobante_asociado`: varchar(15) NULL
- `timbrado_asociado`: varchar(8) NULL
- `revisor_id`: int unsigned NULL
- `fecha_reclamado`: timestamp NULL
- `url_foto_webp`: varchar(255) NULL
- `tipo_papel`: enum('TERMICO','MATRICIAL','PREIMPRESO') NULL
- `confianza_ocr`: decimal(5,2) NULL
- `estado_ocr`: enum('EN_COLA','PROCESANDO','AUTO_PROCESADO','REQUIERE_REVISION','VERIFICADO_HUMANO','ERROR_PROCESAMIENTO') NULL DEFAULT EN_COLA
- `tipo_gasto`: enum('ALIMENTACION','SALUD','EDUCACION','VIVIENDA','VESTIMENTA','ESPARCIMIENTO','CAPACITACION','OTROS') NOT NULL DEFAULT OTROS
- `created_at`: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP (DEFAULT_GENERATED)
- `deleted_at`: timestamp NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **KEY**: KEY `idx_comprobantes_contribuyente_id` (`contribuyente_id`)
- **KEY**: KEY `idx_comprobantes_fecha_emision` (`fecha_emision`)
- **KEY**: KEY `idx_comprobantes_estado_ocr` (`estado_ocr`)
- **KEY**: KEY `idx_comprobantes_ruc_emisor` (`ruc_emisor`)
- **FK**: CONSTRAINT `fk_comprobantes_contribuyente` FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `comprobantes_ventas`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `contribuyente_id`: int unsigned NOT NULL
- `nro_comprobante`: varchar(15) NOT NULL
- `timbrado`: varchar(8) NOT NULL
- `fecha_emision`: date NOT NULL
- `tipo_comprobante_set`: int NOT NULL DEFAULT 109
- `condicion_operacion`: int NOT NULL DEFAULT 1
- `ruc_cliente`: varchar(20) NOT NULL
- `razon_social_cliente`: varchar(255) NOT NULL
- `gravada_10`: decimal(15,0) NOT NULL DEFAULT 0
- `gravada_5`: decimal(15,0) NOT NULL DEFAULT 0
- `exenta`: decimal(15,0) NOT NULL DEFAULT 0
- `iva_10`: decimal(15,0) NOT NULL DEFAULT 0
- `iva_5`: decimal(15,0) NOT NULL DEFAULT 0
- `monto_total`: decimal(15,0) NOT NULL
- `moneda_extranjera`: char(1) NOT NULL DEFAULT N
- `imputa_iva`: char(1) NOT NULL DEFAULT S
- `imputa_ire`: char(1) NOT NULL DEFAULT N
- `imputa_irp`: char(1) NOT NULL DEFAULT S
- `revisor_id`: int unsigned NULL
- `fecha_reclamado`: timestamp NULL
- `url_foto_webp`: varchar(255) NULL
- `estado_ocr`: enum('EN_COLA','PROCESANDO','AUTO_PROCESADO','REQUIERE_REVISION','VERIFICADO_HUMANO','ERROR_PROCESAMIENTO') NULL DEFAULT EN_COLA
- `confianza_ocr`: decimal(5,2) NULL
- `created_at`: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP (DEFAULT_GENERATED)
- `deleted_at`: timestamp NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **KEY**: KEY `idx_comprobantes_ventas_contribuyente_id` (`contribuyente_id`)
- **KEY**: KEY `idx_comprobantes_ventas_fecha_emision` (`fecha_emision`)
- **KEY**: KEY `idx_comprobantes_ventas_estado_ocr` (`estado_ocr`)
- **KEY**: KEY `idx_comprobantes_ventas_ruc_cliente` (`ruc_cliente`)
- **FK**: CONSTRAINT `fk_ventas_contribuyente` FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `contribuyentes`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `persona_id`: int unsigned NOT NULL
- `ruc`: varchar(20) NOT NULL
- `dv`: int NOT NULL
- `razon_social`: varchar(255) NOT NULL
- `tipo_impuesto`: enum('IVA_GENERAL','IRP_RSP','IRE_RESIMPLE') NOT NULL
- `deleted_at`: timestamp NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_contribuyentes_persona` (`persona_id`)
- **UNIQUE**: UNIQUE KEY `uk_contribuyentes_ruc` (`ruc`)
- **KEY**: KEY `idx_contribuyentes_razon_social` (`razon_social`)
- **FK**: CONSTRAINT `fk_contribuyente_persona` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `cuotas_pagos`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `suscripcion_id`: int unsigned NOT NULL
- `monto`: decimal(15,0) NOT NULL
- `fecha_vencimiento`: date NOT NULL
- `fecha_pago`: date NULL
- `estado`: enum('PENDIENTE','PAGADO','VENCIDO') NOT NULL DEFAULT PENDIENTE

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **KEY**: KEY `idx_cuotas_suscripcion_id` (`suscripcion_id`)
- **KEY**: KEY `idx_cuotas_estado` (`estado`)
- **KEY**: KEY `idx_cuotas_fecha_vencimiento` (`fecha_vencimiento`)
- **FK**: CONSTRAINT `fk_cuotas_suscripcion` FOREIGN KEY (`suscripcion_id`) REFERENCES `suscripciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `departamentos`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `nombre`: varchar(100) NOT NULL
- `pais_id`: int unsigned NOT NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_departamentos_nombre_pais` (`nombre`,`pais_id`)
- **KEY**: KEY `idx_departamentos_pais_id` (`pais_id`)
- **FK**: CONSTRAINT `fk_departamentos_paises` FOREIGN KEY (`pais_id`) REFERENCES `paises` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE

---

## Tabla: `grupo_menu`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `nombre`: varchar(100) NOT NULL
- `descripcion`: varchar(255) NULL
- `icono`: text NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_grupo_menu_nombre` (`nombre`)

---

## Tabla: `menu`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `nombre`: varchar(100) NOT NULL
- `descripcion`: varchar(255) NULL
- `grupo_menu_id`: int unsigned NOT NULL
- `url`: varchar(255) NOT NULL
- `icono`: text NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_menu_url` (`url`)
- **KEY**: KEY `idx_menu_grupo_id` (`grupo_menu_id`)
- **FK**: CONSTRAINT `fk_menu_grupo` FOREIGN KEY (`grupo_menu_id`) REFERENCES `grupo_menu` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE

---

## Tabla: `menu_rol`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `menu_id`: int unsigned NOT NULL
- `rol_id`: int unsigned NOT NULL
- `permitir_listar`: tinyint(1) NOT NULL DEFAULT 0
- `permitir_guardar`: tinyint(1) NOT NULL DEFAULT 0
- `permitir_editar`: tinyint(1) NOT NULL DEFAULT 0
- `permitir_eliminar`: tinyint(1) NOT NULL DEFAULT 0

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_menu_rol` (`menu_id`,`rol_id`)
- **KEY**: KEY `idx_menu_rol_rol_id` (`rol_id`)
- **FK**: CONSTRAINT `fk_permiso_menu` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
- **FK**: CONSTRAINT `fk_permiso_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `ocr_entrenamientos`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `comprobante_id`: int unsigned NULL
- `comprobante_venta_id`: int unsigned NULL
- `url_imagen`: varchar(255) NOT NULL
- `json_maquina`: json NOT NULL
- `json_humano`: json NULL
- `estado_entrenamiento`: enum('PENDIENTE','LISTO_PARA_ENTRENAR','ENTRENADO','DESCARTADO') NOT NULL DEFAULT PENDIENTE
- `fecha_creacion`: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP (DEFAULT_GENERATED)
- `fecha_actualizacion`: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP (DEFAULT_GENERATED on update CURRENT_TIMESTAMP)

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_ocr_comprobante_compra` (`comprobante_id`)
- **UNIQUE**: UNIQUE KEY `uk_ocr_comprobante_venta` (`comprobante_venta_id`)
- **KEY**: KEY `idx_ocr_estado_entrenamiento` (`estado_entrenamiento`)
- **FK**: CONSTRAINT `fk_ocr_comprobante` FOREIGN KEY (`comprobante_id`) REFERENCES `comprobantes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
- **FK**: CONSTRAINT `fk_ocr_ventas` FOREIGN KEY (`comprobante_venta_id`) REFERENCES `comprobantes_ventas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `paises`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `nombre`: varchar(100) NOT NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_paises_nombre` (`nombre`)

---

## Tabla: `password_reset_tokens`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `usuario_id`: int unsigned NOT NULL
- `token`: varchar(64) NOT NULL
- `expira_en`: timestamp NOT NULL
- `usado`: tinyint(1) NOT NULL DEFAULT 0
- `created_at`: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP (DEFAULT_GENERATED)

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_token` (`token`)
- **KEY**: KEY `idx_reset_usuario_id` (`usuario_id`)
- **FK**: CONSTRAINT `fk_reset_token_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `persona_documentos`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `persona_id`: int unsigned NOT NULL
- `tipo_documento_id`: int unsigned NOT NULL
- `numero`: varchar(50) NOT NULL
- `fecha_vencimiento`: date NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_persona_tipo_documento` (`persona_id`,`tipo_documento_id`)
- **KEY**: KEY `idx_persona_documentos_tipo_id` (`tipo_documento_id`)
- **KEY**: KEY `idx_persona_documentos_numero` (`numero`)
- **FK**: CONSTRAINT `fk_documento_persona` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
- **FK**: CONSTRAINT `fk_documento_tipo` FOREIGN KEY (`tipo_documento_id`) REFERENCES `tipos_documento` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE

---

## Tabla: `personas`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `nombre`: varchar(100) NOT NULL
- `apellido`: varchar(100) NOT NULL
- `telefono`: varchar(20) NULL
- `direccion`: varchar(255) NULL
- `ciudad_id`: int unsigned NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **KEY**: KEY `idx_personas_ciudad_id` (`ciudad_id`)
- **FK**: CONSTRAINT `fk_personas_ciudades` FOREIGN KEY (`ciudad_id`) REFERENCES `ciudades` (`id`) ON DELETE SET NULL ON UPDATE CASCADE

---

## Tabla: `refresh_tokens`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `usuario_id`: int unsigned NOT NULL
- `token`: varchar(64) NOT NULL
- `expira_en`: timestamp NOT NULL
- `revocado`: tinyint(1) NOT NULL DEFAULT 0
- `created_at`: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP (DEFAULT_GENERATED)

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_refresh_token` (`token`)
- **KEY**: KEY `idx_refresh_usuario_id` (`usuario_id`)
- **FK**: CONSTRAINT `fk_refresh_token_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `roles`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `nombre`: varchar(50) NOT NULL
- `descripcion`: text NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_roles_nombre` (`nombre`)

---

## Tabla: `set_rucs`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `ruc`: varchar(15) NOT NULL
- `dv`: varchar(1) NULL
- `razon_social`: varchar(255) NULL
- `estado`: varchar(50) NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`ruc`)
- **KEY**: KEY `idx_set_rucs_razon_social` (`razon_social`)
- **KEY**: KEY `idx_set_rucs_estado` (`estado`)

---

## Tabla: `suscripciones`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `contribuyente_id`: int unsigned NOT NULL
- `estado`: enum('ACTIVO','MOROSO','CANCELADO') NOT NULL DEFAULT ACTIVO
- `fecha_inicio`: date NOT NULL
- `es_trial`: tinyint(1) NOT NULL DEFAULT 0
- `trial_hasta`: date NULL
- `created_at`: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP (DEFAULT_GENERATED)

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **KEY**: KEY `idx_suscripciones_contribuyente_id` (`contribuyente_id`)
- **KEY**: KEY `idx_suscripciones_estado` (`estado`)
- **FK**: CONSTRAINT `fk_suscripciones_contribuyente` FOREIGN KEY (`contribuyente_id`) REFERENCES `contribuyentes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE

---

## Tabla: `tipos_documento`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `nombre`: varchar(100) NOT NULL
- `codigo`: varchar(10) NOT NULL

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_tipos_documento_nombre` (`nombre`)
- **UNIQUE**: UNIQUE KEY `uk_tipos_documento_codigo` (`codigo`)

---

## Tabla: `usuarios`

- **Engine**: InnoDB
- **Collation**: utf8mb4_unicode_ci

### Columnas
- `id`: int unsigned NOT NULL (auto_increment)
- `email`: varchar(255) NOT NULL
- `password`: varchar(255) NOT NULL
- `persona_id`: int unsigned NOT NULL
- `rol_id`: int unsigned NOT NULL
- `activo`: tinyint(1) NOT NULL DEFAULT 1
- `es_temporal`: tinyint(1) NOT NULL DEFAULT 0
- `fecha_creacion`: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP (DEFAULT_GENERATED)

### Índices y Constraints
- **PK**: PRIMARY KEY (`id`)
- **UNIQUE**: UNIQUE KEY `uk_usuarios_email` (`email`)
- **KEY**: KEY `idx_usuarios_persona_id` (`persona_id`)
- **KEY**: KEY `idx_usuarios_rol_id` (`rol_id`)
- **FK**: CONSTRAINT `fk_usuarios_personas` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
- **FK**: CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE

---

## DISCREPANCIAS BD vs ENTIDADES TYPEORM

Las siguientes diferencias estructurales existen entre la base de datos real y las entidades de TypeORM. **No se han corregido en el código TS todavía** (esto se realizará en fases posteriores):

### UNIQUE presentes solo en BD:
- `uk_contribuyentes_ruc`
- `uk_usuario_contribuyente`
- `uk_persona_tipo_documento`
- `uk_departamentos_nombre_pais`
- `uk_ciudades_nombre_departamento`
- `uk_menu_url`

### Índices no únicos presentes solo en BD:
- `idx_asignaciones_contribuyente_id`
- `idx_ciudades_departamento_id`
- `idx_comprobantes_contribuyente_id`
- `idx_comprobantes_fecha_emision`
- `idx_comprobantes_estado_ocr`
- `idx_comprobantes_ruc_emisor`
- `idx_comprobantes_ventas_contribuyente_id`
- `idx_comprobantes_ventas_fecha_emision`
- `idx_comprobantes_ventas_estado_ocr`
- `idx_comprobantes_ventas_ruc_cliente`
- `idx_contribuyentes_razon_social`
- `idx_cuotas_suscripcion_id`
- `idx_cuotas_estado`
- `idx_cuotas_fecha_vencimiento`
- `idx_departamentos_pais_id`
- `idx_menu_grupo_id`
- `idx_menu_rol_rol_id`
- `idx_ocr_estado_entrenamiento`
- `idx_reset_usuario_id`
- `idx_persona_documentos_tipo_id`
- `idx_persona_documentos_numero`
- `idx_personas_ciudad_id`
- `idx_refresh_usuario_id`
- `idx_set_rucs_razon_social`
- `idx_set_rucs_estado`
- `idx_suscripciones_contribuyente_id`
- `idx_suscripciones_estado`
- `idx_usuarios_persona_id`
- `idx_usuarios_rol_id`

### Comportamientos de Motor:
- **ON UPDATE CASCADE**: La BD tiene `ON UPDATE CASCADE` en sus FKs, mientras que las entidades TypeORM asumen `ON UPDATE NO ACTION` (por defecto de TypeORM).
- **ON DELETE**: La BD registra `ON DELETE RESTRICT`, mientras que TypeORM asume `NO ACTION`. En InnoDB ambos son equivalentes cuando no se usa defer, por lo que no constituye una discrepancia de comportamiento, pero sí textual.
- **Nombres de Foreign Keys (FK)**: La BD tiene nombres definidos manual/explícitamente (ej. `fk_usuarios_personas`), mientras que las entidades no definen el nombre (TypeORM autogeneraría hashes como `FK_899199fd151861c079720cc508f`).
- **Precisión de Timestamp**: La BD almacena timestamps como `timestamp(0)` por defecto, mientras que TypeORM asume `timestamp(6)` (con microsegundos) al generar el diff.

## DECISIÓN SOBRE MOTOR (RESUELTA)
Antes de iniciar P0.6b (tooling), existía un riesgo de divergencia:
- LOCAL: MySQL 8.0.44
- QA actual configurada en `.env`: MariaDB 11.8.9

**D23**: Se establece formalmente **MariaDB 11.8.x** como el Motor Objetivo de Migraciones. El dialecto TypeORM se alineará a `mariadb` para evitar incompatibilidades.
