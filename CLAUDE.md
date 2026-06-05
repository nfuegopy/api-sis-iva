# CLAUDE.md — Facturación IVA API

## 1. Descripción

API REST para lectura, registro y exportación de comprobantes fiscales tributarios de Paraguay (SET/Marangatu). El sistema procesa imágenes de facturas y tickets mediante OCR (Tesseract + Google Vision), extrae datos fiscales, los normaliza según reglas SET y los guarda asociados a un contribuyente. También gestiona usuarios, roles, permisos granulares por menú/acción, asignaciones de usuarios a contribuyentes y exportación de CSV en formato RG90 compatible con Marangatu. Modelo SaaS con módulo de suscripciones y cuotas.

---

## 2. Stack

| Capa | Tecnología |
|---|---|
| Framework | NestJS 11 (TypeScript 5.7) |
| ORM | TypeORM 0.3 |
| Base de datos | MySQL — charset utf8mb4 — sincronización manual (synchronize: false) |
| Auth | JWT (`@nestjs/jwt`) + Passport (`passport-jwt`) |
| Hashing | bcrypt |
| OCR primario | Tesseract.js 7 |
| OCR fallback | Google Cloud Vision (`@google-cloud/vision`) |
| Imágenes | sharp (optimización y conversión a WebP) |
| Storage | Cloudflare R2 vía AWS S3 SDK |
| Backup storage | Firebase Admin SDK (Storage + Firestore) |
| Email | Nodemailer + `@nestjs-modules/mailer` |
| Validación DTOs | class-validator + class-transformer |
| Puerto | 9031 |

---

## 3. Estructura de carpetas `/src`

```
src/
├── main.ts                          # Bootstrap: puerto 9031, CORS, ValidationPipe global
├── app.module.ts
│
├── auth/                            # Autenticación JWT
│   ├── auth.controller.ts           # login, register, me, refresh, logout, forgot/reset/cambiar-password
│   ├── auth.module.ts
│   ├── auth.service.ts              # validateUser, login (JWT+RT), refresh (rotación), logout, forgotPassword, resetPassword, cambiarPassword
│   ├── strategies/jwt.strategy.ts   # JwtStrategy: valida token, verifica activo en BD
│   ├── guards/jwt-auth.guard.ts     # JwtAuthGuard: wrapper AuthGuard('jwt')
│   ├── entities/
│   │   ├── password-reset-token.entity.ts  # Token recuperación contraseña (1h)
│   │   └── refresh-token.entity.ts         # Refresh token (30 días, rotación)
│   └── dto/login.dto.ts + forgot-password.dto.ts + reset-password.dto.ts + cambiar-password.dto.ts
│
├── common/                          # Utilidades transversales
│   ├── autorizacion.module.ts       # @Global() — provee MenuRolGuard
│   ├── guards/
│   │   ├── api-key.guard.ts         # Guard X-API-KEY (departamento, ciudad)
│   │   └── menu-rol.guard.ts        # Consulta menu_rol por rol+menú+método HTTP
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser() → request.user del JWT
│   │   └── permiso.decorator.ts       # @RequierePermiso('/ruta')
│   ├── dto/
│   │   └── paginacion.dto.ts          # page (default 1), limit (default 20, max 100)
│   ├── interfaces/
│   │   └── paginated-result.interface.ts  # { data, total, page, limit, totalPages }
│   └── notifications/
│
├── firebase/ — Firebase Admin SDK (Storage + Firestore)
│
├── gestion/
│   ├── personas/                    # JWT + MenuRol
│   ├── usuarios/                    # JWT + MenuRol — re-hashea password en PATCH
│   └── persona-documentos/          # JWT + MenuRol
│
├── negocio/
│   ├── contribuyentes/              # JWT + MenuRol — valida RUC duplicado
│   ├── comprobantes/                # JWT + MenuRol — CRUD + bolsa revisión
│   ├── comprobantes-ventas/         # JWT + MenuRol — CRUD + bolsa revisión
│   ├── asignaciones-contables/      # JWT + MenuRol
│   ├── exportaciones/               # JWT + MenuRol — CSV RG90
│   ├── suscripciones/               # JWT + MenuRol
│   ├── cuotas-pagos/                # JWT + MenuRol
│   └── ocr-tax/                     # JWT + MenuRol + capa 2 (asignaciones)
│       ├── services/image-optimization / ocr-engine / google-vision / regex-parser / tax-validation
│       ├── helpers/ocr-normalizer / clasificador-gasto
│       └── entities/set-ruc / ocr-entrenamiento
│
└── referenciales/
    ├── geograficos/pais / departamento / ciudad
    └── parametros/roles / menu / grupo-menu / menu-rol / tipos-documento
```

---

## 4. Mapa de endpoints y guards

### Auth (público / protegido)
| Método | Ruta | Guard | Notas |
|---|---|---|---|
| POST | `/auth/login` | Público | Rate limit: 5/min. Devuelve `access_token` + `refresh_token` |
| POST | `/auth/register` | JWT + MenuRol (`/usuarios`) | Crea usuario, envía email de bienvenida |
| GET | `/auth/me` | JWT | Perfil del usuario autenticado |
| POST | `/auth/refresh` | Público | Rota refresh token, devuelve nuevos tokens |
| POST | `/auth/logout` | JWT | Revoca refresh token |
| POST | `/auth/forgot-password` | Público | Envía email con token 64hex (1h) |
| POST | `/auth/reset-password` | Público | Usa token del email, actualiza password |
| POST | `/auth/cambiar-password` | JWT | Cambia password conociendo la actual |

### Gestión
| Método | Ruta | Guard |
|---|---|---|
| CRUD | `/personas` | JWT + MenuRol |
| CRUD | `/persona-documentos` | JWT + MenuRol |
| CRUD | `/usuarios` | JWT + MenuRol |

### Negocio tributario
| Método | Ruta | Guard |
|---|---|---|
| CRUD | `/negocio/contribuyentes` | JWT + MenuRol |
| CRUD + bolsa | `/negocio/comprobantes` | JWT + MenuRol |
| CRUD + bolsa | `/negocio/comprobantes-ventas` | JWT + MenuRol |
| CRUD | `/negocio/asignaciones-contables` | JWT + MenuRol |
| POST | `/ocr-tax/extraer/compra` | JWT + MenuRol + capa 2 |
| POST | `/ocr-tax/extraer/venta` | JWT + MenuRol + capa 2 |
| GET | `/negocio/exportaciones/rg90/compras` | JWT + MenuRol |
| GET | `/negocio/exportaciones/rg90/ventas` | JWT + MenuRol |

### Cobranzas SaaS
| Método | Ruta | Guard |
|---|---|---|
| CRUD | `/cobranzas/suscripciones` | JWT + MenuRol |
| CRUD | `/cobranzas/cuotas-pagos` | JWT + MenuRol |

### Configuración del sistema (solo JWT — sin MenuRolGuard para evitar bootstrap)
| Método | Ruta | Guard |
|---|---|---|
| CRUD | `/roles` + `GET /roles/:id/menus` | JWT |
| CRUD | `/menu` | JWT |
| CRUD | `/grupo-menu` | JWT |
| CRUD | `/menu-rol` | JWT |
| CRUD | `/tipos-documento` | JWT |
| CRUD | `/pais` | JWT |
| CRUD + masivo | `/departamento` | ApiKeyGuard |
| CRUD + masivo | `/ciudad` | ApiKeyGuard |

---

## 5. Sistema de seguridad

### Dos capas
**Capa 1 — MenuRolGuard** (`src/common/guards/menu-rol.guard.ts`)
- JWT válido + `usuario.activo = true` (JwtStrategy lo verifica en BD)
- Mapeo HTTP → flag: `GET→listar`, `POST→guardar`, `PATCH/PUT→editar`, `DELETE→eliminar`
- Consulta `menu_rol` por `rol_id + menu.url`
- Default deny

**Capa 2 — OCR únicamente** (`ocr-tax.controller.ts`)
- Verifica `asignaciones_contables` para el RUC enviado
- Si no hay asignación → 403

### Rate limiting (`@nestjs/throttler`)
- Global: 100 req/min por IP (`ThrottlerGuard` como `APP_GUARD` en `AppModule`)
- Login: 5 req/min por IP (`@Throttle({ default: { limit: 5, ttl: 60000 } })` en el endpoint)

### Flujo de validación global
```
request → ThrottlerGuard (429) → JwtAuthGuard → JwtStrategy (activo en BD) → MenuRolGuard → handler
                                  ↓ 401                                        ↓ 403
```

### ValidationPipe global (`main.ts`)
```typescript
whitelist: true              // elimina propiedades extra del body
forbidNonWhitelisted: true   // retorna 400 si llegan propiedades no declaradas
transform: true
```

### CORS
Variable de entorno `CORS_ORIGIN`. Default dev: `localhost:3000`, `localhost:4200`.
Producción: `CORS_ORIGIN=https://mifrontend.com`

---

## 6. Modelos y tablas — Estado actual vs schema

La base de datos tiene el schema definido en `schema_bd_sis_iva.sql` (ignorado por git).

### Tablas implementadas como entidades TypeORM
> Verificado 2025-06-05: schema y entidades están 100% sincronizados. Los campos marcados como ausentes son consistentemente ausentes en ambos lados — no son bugs, son mejoras futuras documentadas.

| Tabla BD | Entidad | Notas |
|---|---|---|
| `paises` | `Pais` | ✅ |
| `departamentos` | `Departamento` | ✅ |
| `ciudades` | `Ciudad` | ✅ |
| `personas` | `Persona` | ✅ (`email_contacto`, timestamps: ausentes en entidad Y en schema — mejora futura) |
| `tipos_documento` | `TipoDocumento` | ✅ |
| `persona_documentos` | `PersonaDocumento` | ✅ (incluye `fecha_vencimiento` en ambos) |
| `roles` | `Role` | ✅ |
| `usuarios` | `Usuario` | ✅ (campo `fecha_creacion` — mismo nombre en entidad y schema) |
| `grupo_menu` | `GrupoMenu` | ✅ (tiene `descripcion` e `icono` en ambos; sin `orden`/`activo` en ambos) |
| `menu` | `Menu` | ✅ (tiene `descripcion` e `icono` en ambos; sin `orden`/`activo` en ambos) |
| `menu_rol` | `MenuRol` | ✅ (UNIQUE `menu_id+rol_id` en ambos) |
| `contribuyentes` | `Contribuyente` | ✅ (`deleted_at` presente; `activo` y `updated_at` ausentes en entidad Y en schema) |
| `asignaciones_contables` | `AsignacionContable` | ✅ |
| `comprobantes` | `Comprobante` | ✅ (`revisor_id`, `fecha_reclamado` y `deleted_at` en entidad y schema) |
| `comprobantes_ventas` | `ComprobanteVenta` | ✅ (`deleted_at` agregado; `tipo_identificacion_cliente` no existe en schema) |
| `set_rucs` | `SetRuc` | ✅ (`created_at`/`updated_at`: ausentes en entidad Y en schema) |
| `ocr_entrenamientos` | `OcrEntrenamiento` | ✅ (UNIQUE para comprobante_id Y comprobante_venta_id en ambos) |
| `suscripciones` | `Suscripcion` | ✅ |
| `cuotas_pagos` | `CuotaPago` | ✅ |

### Tablas SET — no existen en el schema actual
Los catálogos SET (`set_tipo_comprobante`, `set_condicion_operacion`, `set_tipo_identificacion`, `set_tipo_registro`, `set_valor_logico`) **no están en el schema actual ni tienen entidades TypeORM**. Los valores se validan a nivel DTO en la API. No hay FK activas hacia tablas SET — no bloquean inserts de comprobantes.

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
menu_id=17 → /negocio/comprobantes-ventas
```

> ⚠️ El schema SQL tiene un seed de menús con URLs distintas (`/comprobantes/compras`, `/contribuyentes`, etc.). Si se aplica ese seed, rompe el `MenuRolGuard`. Usar únicamente las URLs de la tabla de arriba.

---

## 7. Lógica de negocio importante

### Autenticación y gestión de contraseñas (`/auth`)

**Login** devuelve `{ access_token, refresh_token, user }`. El `access_token` dura 8h (JWT), el `refresh_token` dura 30 días (BD).

**Refresh token** implementa rotación: cada `/auth/refresh` invalida el token anterior y emite uno nuevo. Si el token es robado y ya fue rotado, el intento falla con 401.

**Tabla `password_reset_tokens`:** token 64hex, expira en 1h, marcado como `usado` tras el reset. Se invalidan tokens anteriores del mismo usuario en cada nueva solicitud.

**Tabla `refresh_tokens`:** token 64hex, expira en 30 días, campo `revocado`. Se revoca en logout y se rota en cada refresh.

### Pipeline OCR (`/ocr-tax`)
1. JWT + `activo` (JwtStrategy)
2. `permitir_guardar` en `/ocr-tax` (MenuRolGuard)
3. RUC existe como contribuyente
4. `asignaciones_contables` válida (capa 2)
5. Buffer no vacío, MIME = JPG/PNG/WebP, tamaño ≤ 5 MB
6. sharp → WebP → Cloudflare R2
7. Tesseract.js (primario) → si confianza < 75% o faltan campos → Google Vision (fallback)
8. RegexParserService extrae campos fiscales
9. InvoiceParaguayValidatorService valida: cuadratura matemática, formato timbrado, total > 0
10. Busca RUC en `set_rucs` para razón social y estado
11. ClasificadorGastoHelper clasifica tipo gasto IRP
12. Guarda en `comprobantes` / `comprobantes_ventas` + cápsula en `ocr_entrenamientos`
13. `AUTO_PROCESADO` si pasa todo; `REQUIERE_REVISION` si hay dudas

### Exportación RG90
- `Rg90BuilderService` genera CSV orden exacto Marangatu
- Tipo registro: compras=2, ventas=1
- RUC sin DV, montos enteros, fechas `dd/mm/aaaa`
- Descarga como `.csv`

### Bolsa de revisión (compras y ventas)
- `GET .../bolsa/pendientes` — lista `estado_ocr='REQUIERE_REVISION'` sin `revisor_id`
- `POST .../bolsa/:id/reclamar` — asigna el comprobante al `usuario.id` del JWT
- Protege contra doble reclamo concurrente

### Email — 3 plantillas implementadas (`NotificationsService`)
| Método | Cuándo se llama |
|---|---|
| `sendBienvenidaEmail` | Al crear usuario (`es_temporal: false`) |
| `sendResetPasswordEmail` | Al solicitar recuperación de contraseña |
| `sendCotizacionEmail` | (Heredado otro proyecto — no usar en IVA) |

---

## 8. Estado actual — Resumen de todo lo implementado

### Seguridad
- `JwtStrategy` verifica firma, BD y `activo`
- `JwtAuthGuard` en todos los endpoints
- `MenuRolGuard` en datos de negocio
- `@RequierePermiso` declarado en cada controller
- `POST /auth/register` protegido con JWT + permiso guardar `/usuarios`
- Capa 2 OCR: `asignaciones_contables` validada en ambos endpoints
- `console.log` de contraseñas eliminado
- ID hardcodeado `999` eliminado
- Re-hash de password en PATCH usuarios

### Validaciones y producción
- `synchronize: false` — BD no se altera al arrancar
- `whitelist: true` + `forbidNonWhitelisted: true` — body estricto
- CORS con `CORS_ORIGIN` por env var
- MIME + 5 MB en FileInterceptor OCR
- Validación matemática fiscal en `extraerVenta`
- DTOs con `@Matches`, `@Length`, `@Min`, `@IsIn(['S','N'])`, `@IsIn([tipos SET])`
- `remove()` consistente en todos los services — retorna `{ message }`
- RUC duplicado → `ConflictException`
- FK errors → `BadRequestException` descriptivo
- `estado_ocr` con 6 estados en `comprobante.entity.ts`
- `created_at` en comprobante entity (migración aplicada)

### BD configurada y ejecutada (2026-06-05)
- 22 tablas — schema aplicado en MySQL 8.0 local. Listo para servidor.
- 5 grupos de menú, 17 menús, 41 registros `menu_rol`
- Roles: 1=Administrador (LGED en todo), 2=Contador (acceso operativo), 3=Solo Lectura (consulta)
- charset `utf8mb4` en conexión TypeORM
- Usuario administrador inicial: `admin@sistema.com` / `12356` / rol_id=1 (bcrypt 10 rounds)
- Tablas nuevas activas: `refresh_tokens`, `password_reset_tokens`
- Soft delete activo: `deleted_at` en `contribuyentes`, `comprobantes`, `comprobantes_ventas`
- Corrección aplicada: eliminado CHECK constraint en `ocr_entrenamientos` (incompatible con MySQL 8.0 + FK)

### Módulos completos
- CRUD: personas, usuarios, documentos, contribuyentes, comprobantes (compras y ventas), asignaciones, suscripciones, cuotas, roles, menús, grupos, tipos-documento, países
- OCR pipeline: Tesseract + Vision + validación fiscal + R2
- Exportación RG90 compras y ventas
- Bolsa de revisión para compras y ventas
- Paginación: `GET /negocio/comprobantes`, `GET /negocio/comprobantes-ventas`, `GET /negocio/contribuyentes` devuelven `{ data, total, page, limit, totalPages }`. Query params: `?page=1&limit=20`
- Rate limiting: 100 req/min global, 5 req/min en `/auth/login`
- Refresh token: login devuelve `access_token` (8h) + `refresh_token` (30d). `/auth/refresh` rota. `/auth/logout` revoca
- Soft delete: `comprobantes`, `comprobantes_ventas`, `contribuyentes` tienen `deleted_at`. `DELETE` usa `softDelete()` — el registro permanece en BD con `deleted_at` no nulo, invisible para `find()`
- GET /auth/me: devuelve el perfil completo del usuario autenticado

### Email — estado del módulo
- Librerías instaladas: `@nestjs-modules/mailer` ^2.0.1, `nodemailer` ^8.0.5, `handlebars` ^4.7.9
- SMTP configurado en `.env`: Hostinger puerto 465 SSL (`contacto@acbldeveloper.com`)
- `NotificationsModule` global con `SmtpEmailProvider` vía `MailerModule`
- Email de bienvenida enviado fire-and-forget al crear usuario (`es_temporal: false`)
- Email de reset enviado fire-and-forget en `forgot-password`

---

## 9. Cobranzas SaaS — Estado y análisis

### Lo que SÍ está implementado
- `suscripciones`: registro de estado (ACTIVO / MOROSO / CANCELADO) por contribuyente
- `cuotas_pagos`: registro de cuotas con monto, vencimiento, fecha de pago, estado (PENDIENTE / PAGADO / VENCIDO)
- CRUD completo de ambas tablas con JWT + MenuRolGuard
- El `estado` de suscripción puede leerse para condicionar operaciones (ejemplo: bloquear exportación si CANCELADO)

### Lo que NO está implementado
| Concepto | Estado |
|---|---|
| Plan/tier del servicio (básico, premium, enterprise) | ❌ No existe tabla `planes` |
| Límites por plan (máx. comprobantes por mes, usuarios, contribuyentes) | ❌ Sin lógica de cuotas de uso |
| Período de prueba / free trial | ❌ Sin campo `trial_hasta` ni lógica |
| Estado de cuenta visible para el contribuyente | ❌ Sin endpoint de resumen |
| Facturación automática (generar cuotas al renovar) | ❌ Manual |
| Bloqueo automático al vencer | ❌ Sin middleware que evalúe suscripción en cada request |
| Modo libre para pruebas/recopilación de datos | ❌ Sin flag de bypass |

### Para implementar "modo libre para pruebas"
La forma más limpia sería agregar en `suscripciones` un campo `es_trial BOOLEAN DEFAULT FALSE` y una fecha `trial_hasta DATE`. Un guard o interceptor verificaría antes de operaciones de negocio: si el contribuyente tiene suscripción activa O está en período de prueba, puede operar. Esto permitiría recopilar datos reales sin cobrar antes de lanzar el billing.

---

## 10. Pendiente / Gaps funcionales

### Verificado 2025-06-05 — entidades y schema 100% sincronizados
No hay desincronización entre entidades TypeORM y el schema SQL. Los campos "faltantes" (email_contacto, activo en contribuyentes, timestamps opcionales, etc.) están consistentemente ausentes en ambos lados. Son mejoras futuras, no bugs.

### Gaps funcionales pendientes — qué falta en la API

| Gap | Impacto | Esfuerzo |
|---|---|---|
| **Paginación en módulos secundarios** (personas, usuarios, suscripciones, cuotas, asignaciones, roles, menu, etc.) | Bajo — son catálogos pequeños | Bajo |
| **Limpieza de tokens expirados** (`refresh_tokens` y `password_reset_tokens` se acumulan) | Medio — rendimiento en el tiempo | Bajo — cron job con `@nestjs/schedule` |
| **Guard de suscripción** — bloqueo automático si `estado=CANCELADO` | Alto para SaaS real | Medio |
| **Módulo de planes/tiers** — tabla `planes` + límites por plan | Alto para SaaS real | Alto |
| **Free trial** — campo `es_trial + trial_hasta` en suscripciones | Medio | Bajo |
| **Anti-duplicado tributario** — UNIQUE `(contribuyente_id, ruc_emisor, timbrado, nro_comprobante)` en comprobantes | Alto — evita doble carga | Bajo (ALTER TABLE + validación API) |
| **Endpoint `GET /roles/:id/menus`** — para que frontend construya menú dinámico | Alto para frontend | Bajo |
| **`email_contacto` en personas** — ausente en entidad y schema | Bajo — el login usa `usuarios.email` | Bajo |
| **`comprobante_asociado/timbrado_asociado` en ventas** — solo en compras | Medio — notas crédito/débito de ventas | Bajo |
| **Auditoría de cambios** (`updated_at`, `updated_by`) en comprobantes | Medio | Medio |

### Para levantar en un servidor nuevo (listo ✅)
El archivo `schema_bd_sis_iva.sql` contiene todo lo necesario para instalación fresca:
```bash
mysql -u root -pTUPASSWORD < schema_bd_sis_iva.sql
```
Incluye: 22 tablas, seed de roles, grupos, menús, permisos (41 registros menu_rol) y usuario admin.

> **MySQL 8.0** — Se removió el CHECK constraint de `ocr_entrenamientos` (incompatible con FK en MySQL 8.0). No se pueden usar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (sintaxis MariaDB). Para actualizar BD existente, usar los `ALTER TABLE` sin `IF NOT EXISTS` comentados al final del script.

---

## 11. Convenciones del código

- **NestJS module-first**: `XxxModule`, `XxxController`, `XxxService`, `xxx.entity.ts`, `create-xxx.dto.ts` / `update-xxx.dto.ts`
- **Nombres**: BD en `snake_case`; TypeScript en `camelCase`; clases en `PascalCase`
- **Guards por tipo**:
  - Negocio → `@UseGuards(JwtAuthGuard, MenuRolGuard)` + `@RequierePermiso('/ruta')`
  - Configuración sistema → `@UseGuards(JwtAuthGuard)` solamente
  - Geo carga masiva → `@UseGuards(ApiKeyGuard)`
  - Login → sin guard
- **Transacciones**: `QueryRunner` para operaciones multi-tabla
- **Relaciones `eager: true`** en `Usuario.persona`, `Usuario.rol`, `Persona.documentos`
- **`@CurrentUser()`** → `{ id, email, rol: { id, nombre } }`
- **Errores estándar**: `NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException`
- **remove()** → siempre retorna `{ message: '...' }`

---

## 12. Variables de entorno requeridas

```env
DB_HOST=
DB_PORT=3306
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=bd_sis_iva

JWT_SECRET=
JWT_EXPIRATION=8h

CORS_ORIGIN=http://localhost:3000

API_KEY=                        # Para endpoints ApiKeyGuard (departamento, ciudad)

R2_ENDPOINT=                    # Cloudflare R2
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

FIREBASE_STORAGE_BUCKET=        # Firebase (backup storage)
FIREBASE_CREDENTIALS=           # JSON como string

# SMTP (Hostinger — puerto 465 SSL)
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_SECURE=true                # true para puerto 465, false para 587
MAIL_USER=                      # cuenta de email Hostinger
MAIL_PASS=                      # contraseña
MAIL_FROM=                      # "Nombre <cuenta@dominio.com>"
MAIL_IGNORE_TLS=false           # true solo para certificados auto-firmados en dev
```

---

## 13. Colección Postman

Archivo: `collection/Facturacion-IVA.postman_collection.json` (en `.gitignore`)

Variables: `baseUrl=http://localhost:9031`, `token=` (access_token del login), `apiKey=`

Credenciales de prueba: `antonio@demo.com` / `123456`
