# CLAUDE.md — Facturación IVA API

## 1. Descripción

API REST para lectura, registro y exportación de comprobantes fiscales tributarios de Paraguay (SET/Marangatu). El sistema procesa imágenes de facturas y tickets mediante OCR (Tesseract + Google Vision), extrae datos fiscales, los normaliza según reglas SET y los guarda asociados a un contribuyente. También gestiona usuarios, roles, permisos granulares por menú/acción, asignaciones de usuarios a contribuyentes y exportación de CSV en formato RG90 compatible con Marangatu.

---

## 2. Stack

| Capa | Tecnología |
|---|---|
| Framework | NestJS 11 (TypeScript 5.7) |
| ORM | TypeORM 0.3 |
| Base de datos | MySQL (driver mysql2) |
| Auth | JWT (`@nestjs/jwt`) + Passport (`passport-jwt`) |
| Hashing | bcrypt |
| OCR primario | Tesseract.js 7 |
| OCR fallback | Google Cloud Vision (`@google-cloud/vision`) |
| Imágenes | sharp (optimización y conversión a WebP) |
| Storage | Firebase Admin SDK (Storage + Firestore) + AWS S3 SDK |
| Email | Nodemailer + `@nestjs-modules/mailer` |
| Validación DTOs | class-validator + class-transformer |
| Puerto | 9031 |

---

## 3. Estructura de carpetas `/src`

```
src/
├── main.ts                          # Bootstrap: puerto 9031, ValidationPipe global
├── app.module.ts / app.controller.ts / app.service.ts
│
├── auth/                            # Autenticación JWT
│   ├── auth.controller.ts           # POST /auth/login (público) y /auth/register (protegido)
│   ├── auth.module.ts               # Configura PassportModule + JwtModule desde .env
│   ├── auth.service.ts              # validateUser, login (genera JWT)
│   ├── strategies/jwt.strategy.ts   # JwtStrategy: valida token, verifica activo en BD
│   ├── guards/jwt-auth.guard.ts     # JwtAuthGuard: wrapper AuthGuard('jwt')
│   └── dto/login.dto.ts
│
├── common/                          # Utilidades transversales
│   ├── autorizacion.module.ts       # @Global() — provee MenuRolGuard a toda la app
│   ├── guards/
│   │   ├── api-key.guard.ts         # Guard por header X-API-KEY (departamento, ciudad)
│   │   └── menu-rol.guard.ts        # MenuRolGuard: consulta menu_rol por rol+menú+método
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser() → request.user del JWT
│   │   └── permiso.decorator.ts       # @RequierePermiso('/ruta') → marca menú del controller
│   └── notifications/
│       ├── notifications.service.ts
│       └── providers/smtp-email.provider.ts / firebase-email.provider.ts
│
├── firebase/
│   └── firebase.service.ts          # Inicializa Firebase Admin SDK (Storage + Firestore)
│
├── gestion/                         # Sujetos del sistema
│   ├── personas/                    # CRUD — JwtAuthGuard + MenuRolGuard
│   ├── usuarios/                    # CRUD — JwtAuthGuard + MenuRolGuard
│   └── persona-documentos/          # CRUD — JwtAuthGuard + MenuRolGuard
│
├── negocio/                         # Núcleo de negocio tributario
│   ├── contribuyentes/              # CRUD — JwtAuthGuard + MenuRolGuard
│   ├── comprobantes/                # CRUD + bolsa revisión — JwtAuthGuard + MenuRolGuard
│   ├── comprobantes-ventas/         # Entidad + repositorio (sin controller CRUD propio)
│   ├── asignaciones-contables/      # CRUD — JwtAuthGuard + MenuRolGuard
│   ├── exportaciones/               # CSV RG90 — JwtAuthGuard + MenuRolGuard
│   ├── suscripciones/               # CRUD — JwtAuthGuard + MenuRolGuard
│   ├── cuotas-pagos/                # CRUD — JwtAuthGuard + MenuRolGuard
│   └── ocr-tax/                     # Pipeline OCR — JwtAuthGuard + MenuRolGuard + capa 2
│       ├── ocr-tax.controller.ts    # POST /ocr-tax/extraer/compra y /venta
│       ├── entities/set-ruc.entity.ts / ocr-entrenamiento.entity.ts
│       ├── helpers/ocr-normalizer.helper.ts / clasificador-gasto.helper.ts
│       └── services/image-optimization / ocr-engine / google-vision / regex-parser / tax-validation
│
└── referenciales/
    ├── geograficos/
    │   ├── pais/          # CRUD — JwtAuthGuard
    │   ├── departamento/  # CRUD + masivo — ApiKeyGuard
    │   └── ciudad/        # CRUD + masivo — ApiKeyGuard
    └── parametros/
        ├── roles/         # CRUD + GET /:id/menus — JwtAuthGuard
        ├── menu/          # CRUD — JwtAuthGuard
        ├── grupo-menu/    # CRUD — JwtAuthGuard
        ├── menu-rol/      # CRUD — JwtAuthGuard (sin MenuRolGuard para evitar bootstrap)
        └── tipos-documento/ # CRUD — JwtAuthGuard
```

---

## 4. Endpoints completos

### Auth
| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público | Valida email+password, retorna JWT |
| POST | `/auth/register` | JWT + MenuRol (`/usuarios`) | Crea usuario — requiere permiso guardar en /usuarios |

### Gestión de personas y usuarios
| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST/GET/PATCH/DELETE | `/personas` | JWT + MenuRol | CRUD personas con transacciones atómicas |
| POST/GET/PATCH/DELETE | `/persona-documentos` | JWT + MenuRol | CRUD documentos de personas |
| POST/GET/PATCH/DELETE | `/usuarios` | JWT + MenuRol | CRUD usuarios |

### Negocio tributario
| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST/GET/PATCH/DELETE | `/negocio/contribuyentes` | JWT + MenuRol | CRUD contribuyentes |
| GET | `/negocio/comprobantes/bolsa/pendientes` | JWT + MenuRol | Comprobantes sin revisar |
| POST | `/negocio/comprobantes/bolsa/:id/reclamar` | JWT + MenuRol | Reclamar para revisión |
| POST/GET/PATCH/DELETE | `/negocio/comprobantes` | JWT + MenuRol | CRUD comprobantes de compra |
| POST/GET/PATCH/DELETE | `/negocio/asignaciones-contables` | JWT + MenuRol | CRUD asignaciones usuario↔contribuyente |

### OCR
| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST | `/ocr-tax/extraer/compra` | JWT + MenuRol + capa 2 | Imagen → comprobante compra. Valida asignacion_contable |
| POST | `/ocr-tax/extraer/venta` | JWT + MenuRol + capa 2 | Imagen → comprobante venta. Valida asignacion_contable |

### Exportaciones
| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| GET | `/negocio/exportaciones/rg90/compras` | JWT + MenuRol | CSV compras RG90. Params: `contribuyente_id`, `anio`, `mes` (opcional) |
| GET | `/negocio/exportaciones/rg90/ventas` | JWT + MenuRol | CSV ventas RG90. Mismos params |

### Cobranzas SaaS
| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST/GET/PATCH/DELETE | `/cobranzas/suscripciones` | JWT + MenuRol | CRUD suscripciones (filtro `?contribuyente_id=`) |
| POST/GET/PATCH/DELETE | `/cobranzas/cuotas-pagos` | JWT + MenuRol | CRUD cuotas (filtro `?suscripcion_id=`) |

### Referenciales geográficos
| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST/GET/PATCH/DELETE | `/pais[/masivo]` | JwtAuthGuard | CRUD países |
| POST/GET/PATCH/DELETE | `/departamento[/masivo]` | ApiKeyGuard | CRUD departamentos |
| POST/GET/PATCH/DELETE | `/ciudad[/masivo]` | ApiKeyGuard | CRUD ciudades |

### Referenciales de parámetros (configuración del sistema)
| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| POST/GET/PATCH/DELETE | `/roles` | JwtAuthGuard | CRUD roles |
| GET | `/roles/:id/menus` | JwtAuthGuard | Menús y permisos del rol (usado por el frontend) |
| POST/GET/PATCH/DELETE | `/menu` | JwtAuthGuard | CRUD ítems de menú |
| POST/GET/PATCH/DELETE | `/grupo-menu` | JwtAuthGuard | CRUD grupos de menú |
| POST/GET/PATCH/DELETE | `/menu-rol` | JwtAuthGuard | CRUD permisos por rol+menú |
| POST/GET/PATCH/DELETE | `/tipos-documento` | JwtAuthGuard | CRUD tipos de documento |

> Los endpoints de configuración (`/roles`, `/menu`, `/grupo-menu`, `/menu-rol`, `/tipos-documento`, `/pais`) usan solo `JwtAuthGuard` sin `MenuRolGuard` para evitar el problema de bootstrap circular: no se puede crear permisos si ya necesitás permisos para crearlos.

---

## 5. Modelos y tablas principales

| Tabla | Propósito |
|---|---|
| `paises` / `departamentos` / `ciudades` | Geografía normalizada |
| `personas` | Sujetos base (físicos o jurídicos) |
| `tipos_documento` / `persona_documentos` | Documentos de identidad de personas |
| `roles` | Perfiles de acceso. Roles existentes: 1=Administrador, 2=Contador |
| `usuarios` | Cuentas del sistema (email + hash bcrypt + activo + es_temporal) |
| `grupo_menu` | Agrupadores visuales del menú. 5 grupos: Negocio, Seguridad, Cobranzas, Gestión, Referenciales |
| `menu` | 16 ítems de menú con URLs que coinciden con `@RequierePermiso` de cada controller |
| `menu_rol` | Permisos granulares: `permitir_listar/guardar/editar/eliminar` por menú+rol. 27 registros activos |
| `contribuyentes` | Entidad fiscal principal (RUC, DV, régimen: `IVA_GENERAL`, `IRP_RSP`, `IRE_RESIMPLE`) |
| `asignaciones_contables` | Relación usuario ↔ contribuyente operable (capa 2 de seguridad) |
| `comprobantes` | Comprobantes de **compra** recibidos (SET tipo 2) |
| `comprobantes_ventas` | Comprobantes de **venta** emitidos (SET tipo 1) |
| `set_rucs` | Tabla local de RUCs SET para validar emisores vía OCR |
| `ocr_entrenamientos` | Trazabilidad OCR: `json_maquina` vs `json_humano` |
| `suscripciones` | Estado comercial SaaS: `ACTIVO / MOROSO / CANCELADO` |
| `cuotas_pagos` | Cuotas y vencimientos de suscripciones |

### URLs de menú registradas en BD (deben coincidir con `@RequierePermiso`)
```
menu_id=1  → /negocio/comprobantes
menu_id=2  → /negocio/contribuyentes
menu_id=3  → /negocio/exportaciones
menu_id=4  → /ocr-tax
menu_id=5  → /negocio/asignaciones-contables
menu_id=6  → /usuarios
menu_id=7  → /roles
menu_id=8  → /menu
menu_id=9  → /grupo-menu
menu_id=10 → /menu-rol
menu_id=11 → /cobranzas/suscripciones
menu_id=12 → /cobranzas/cuotas-pagos
menu_id=13 → /personas
menu_id=14 → /persona-documentos
menu_id=15 → /tipos-documento
menu_id=16 → /pais
```

### Campos clave de `comprobantes` y `comprobantes_ventas`
- `tipo_comprobante_set` (ej: 109 = Factura, 110 = Nota de crédito)
- `condicion_operacion` (1 = Contado, 2 = Crédito)
- `imputa_iva / imputa_ire / imputa_irp / no_imputa` (valores `S` / `N`)
- `moneda_extranjera` (`S` / `N`)
- `estado_ocr`: `EN_COLA → PROCESANDO → AUTO_PROCESADO / REQUIERE_REVISION / VERIFICADO_HUMANO / ERROR_PROCESAMIENTO`

---

## 6. Lógica de negocio importante

### Sistema de seguridad en dos capas

**Capa 1 — MenuRolGuard** (`src/common/guards/menu-rol.guard.ts`)
- Lee `request.user.rol.id` del JWT (populado por `JwtStrategy`)
- Lee el menú declarado con `@RequierePermiso('/ruta')` en el controller
- Mapea HTTP → flag: `GET→permitir_listar`, `POST→permitir_guardar`, `PATCH/PUT→permitir_editar`, `DELETE→permitir_eliminar`
- Consulta `menu_rol` cruzando `rol_id` + `menu.url`
- Default deny: sin metadata o sin registro → 403
- Usa `DataSource` global en lugar de `@InjectRepository` para funcionar en cualquier módulo

**Capa 2 — Validación de asignaciones en OCR** (`ocr-tax.controller.ts`)
- Después de pasar la capa 1, verifica que `asignaciones_contables` tenga un registro para `{usuario_id, contribuyente_id}`
- Si no hay asignación → 403. El Capa 1 sabe si podés usar OCR; la Capa 2 sabe para qué RUC podés usarlo.

### Pipeline OCR
1. JWT válido + usuario activo (JwtStrategy)
2. Permiso `permitir_guardar` en `/ocr-tax` para el rol del usuario (MenuRolGuard)
3. RUC existe como contribuyente en BD
4. Usuario tiene asignación contable al contribuyente (capa 2)
5. Imagen → sharp (WebP) → Tesseract.js
6. Si confianza < 75% o faltan campos → fallback Google Vision
7. RegexParserService extrae campos fiscales
8. InvoiceParaguayValidatorService valida reglas SET
9. Busca RUC en `set_rucs` para razón social y estado
10. ClasificadorGastoHelper clasifica tipo gasto IRP
11. Guarda en `comprobantes` / `comprobantes_ventas` + cápsula en `ocr_entrenamientos`

### Exportación RG90
- `Rg90BuilderService` genera CSV en orden exigido por Marangatu
- Compras: tipo registro `2`; Ventas: tipo registro `1`
- RUC sin dígito verificador, montos enteros, fechas en `dd/mm/aaaa`

### Creación de personas y usuarios
- `PersonasService.create()` usa `QueryRunner` — transacción atómica persona + documentos
- `UsuariosService.create()` acepta `persona_id` existente o datos de persona nuevos
- Hash bcrypt automático vía `@BeforeInsert()` en entidad `Usuario`

---

## 7. Estado actual

### Hecho — Seguridad
- `JwtStrategy` verifica firma JWT, consulta BD, valida `usuario.activo`
- `JwtAuthGuard` activo en **todos los controllers** (no quedan endpoints sin protección salvo `/auth/login`)
- `MenuRolGuard` activo en todos los endpoints de datos de negocio
- `@RequierePermiso` declara el menú en cada controller — mapeo exacto con tabla `menu` de BD
- `POST /auth/register` protegido con JWT + permiso `permitir_guardar` en `/usuarios`
- Capa 2 OCR restaurada: `asignaciones_contables` validada en `extraer/compra` y `extraer/venta`
- `console.log` de contraseñas eliminado de `auth.service.ts`
- ID hardcodeado `|| 999` eliminado de `comprobantes.controller.ts`

### Hecho — BD configurada
- 5 grupos de menú creados vía API
- 16 menús creados con URLs exactas que coinciden con `@RequierePermiso`
- 27 registros `menu_rol`: Administrador con acceso total `[LGED]` en los 16 menús; Contador con acceso operativo en 11 menús

### Permisos del rol Contador
| Menu | Listar | Guardar | Editar | Eliminar |
|---|---|---|---|---|
| Comprobantes | ✅ | ✅ | ✅ | ❌ |
| Contribuyentes | ✅ | ❌ | ❌ | ❌ |
| Exportaciones | ✅ | ❌ | ❌ | ❌ |
| OCR | ❌ | ✅ | ❌ | ❌ |
| Asignaciones | ✅ | ❌ | ❌ | ❌ |
| Suscripciones/Cuotas | ✅ | ❌ | ❌ | ❌ |
| Personas/Documentos | ✅ | ✅ | ✅ | ❌ |
| Tipos doc / Países | ✅ | ❌ | ❌ | ❌ |

### Pendiente
- **Encoding MySQL**: acentos y caracteres especiales no se almacenan correctamente — falta configurar `charset: utf8mb4` en la conexión TypeORM
- **`comprobantes-ventas`** sin controller CRUD propio — solo se accede vía OCR
- No existe módulo de reportes o dashboard
- `set_rucs` sin endpoint CRUD expuesto
- `comprobante_asociado` / `timbrado_asociado` no modelados en `comprobantes_ventas`
- No hay soft delete — borrado físico con `ON DELETE CASCADE`
- Validar que `synchronize: true` en `AppModule` se cambie a `false` antes de producción

---

## 8. Convenciones del código

- **NestJS module-first**: cada recurso tiene `XxxModule`, `XxxController`, `XxxService`, `xxx.entity.ts`, `create-xxx.dto.ts` / `update-xxx.dto.ts`
- **Nombres**: campos BD en `snake_case`; TypeScript en `camelCase`; clases en `PascalCase`
- **DTOs**: `class-validator` + `class-transformer`; `UpdateXxxDto` extiende `PartialType(CreateXxxDto)`
- **Prefijos de ruta**: `negocio/` para tributario; `cobranzas/` para SaaS; sin prefijo para referenciales y gestión
- **Guards por tipo de endpoint**:
  - Datos de negocio → `@UseGuards(JwtAuthGuard, MenuRolGuard)` + `@RequierePermiso('/ruta')`
  - Configuración del sistema → `@UseGuards(JwtAuthGuard)` solamente
  - Carga masiva de geo → `@UseGuards(ApiKeyGuard)` con header `X-API-KEY`
  - Login → sin guard (público)
- **Transacciones**: `QueryRunner` de TypeORM para operaciones multi-tabla (personas + documentos)
- **Relaciones `eager: true`** en `Usuario.persona`, `Usuario.rol`, `Persona.documentos`
- **`@CurrentUser()`** retorna `{ id, email, rol: { id, nombre } }` desde el JWT
- **Logging**: `Logger` de NestJS en servicios complejos (Firebase, OCR)
- **Errores estándar**: `NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException`

---

## 9. Colección Postman

Archivo: `collection/Facturacion-IVA.postman_collection.json` (en `.gitignore`, no se sube)

Variables de entorno necesarias:
- `baseUrl` = `http://localhost:9031`
- `token` = (pegar `access_token` del login)
- `apiKey` = (valor de `API_KEY` del `.env`, para departamento y ciudad)

Credenciales de prueba: `antonio@demo.com` / `123456`
