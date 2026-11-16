# CLAUDE.md â€” FacturaciÃ³n IVA API

> ⚠️ **Corregido P0.7** C1: Autoridad .ai-work/TASKS.md, SYSTEM_STATE.md (fuente de verdad).

## Correcciones P0.7
| SecciÃ³n | CorrecciÃ³n |
|---|---|


## 1. DescripciÃ³n

API REST para lectura, registro y exportaciÃ³n de comprobantes fiscales tributarios de Paraguay (SET/Marangatu). El sistema procesa imÃ¡genes de facturas y tickets mediante OCR (Tesseract + Google Vision), extrae datos fiscales, los normaliza segÃºn reglas SET y los guarda asociados a un contribuyente. TambiÃ©n gestiona usuarios, roles, permisos granulares por menÃº/acciÃ³n, asignaciones de usuarios a contribuyentes y exportaciÃ³n de CSV en formato RG90 compatible con Marangatu. Modelo SaaS con mÃ³dulo de suscripciones y cuotas.

---

## 2. Stack

| Capa | TecnologÃ­a |
|---|---|
| Framework | NestJS 11 (TypeScript 5.7) |
| ORM | TypeORM 0.3 |
| Base de datos | MySQL â€” charset utf8mb4 â€” sincronizaciÃ³n manual (synchronize: false) |
| Auth | JWT (`@nestjs/jwt`) + Passport (`passport-jwt`) + Google OAuth2 (`passport-google-oauth20`) |
| Hashing | bcrypt |
| OCR primario | Tesseract.js 7 |
| OCR fallback | Google Cloud Vision (`@google-cloud/vision`) |
| ImÃ¡genes | sharp (optimizaciÃ³n y conversiÃ³n a WebP) |
| Storage | Cloudflare R2 vÃ­a AWS S3 SDK |
| Email | Nodemailer + `@nestjs-modules/mailer` |
| ValidaciÃ³n DTOs | class-validator + class-transformer |
| Puerto | `9031` (default) â€” configurable vÃ­a variable de entorno `PORT` |

---

## 3. Estructura de carpetas `/src`

```
src/
â”œâ”€â”€ main.ts                          # Bootstrap: puerto 9031, CORS, ValidationPipe global
â”œâ”€â”€ app.module.ts
â”‚
â”œâ”€â”€ auth/                            # AutenticaciÃ³n JWT + Google OAuth2
â”‚   â”œâ”€â”€ auth.controller.ts           # login, register, me, refresh, logout, forgot/reset/cambiar-password, google, google/callback
â”‚   â”œâ”€â”€ auth.module.ts
â”‚   â”œâ”€â”€ auth.service.ts              # validateUser, login (JWT+RT), refresh (rotaciÃ³n), logout, forgotPassword, resetPassword, cambiarPassword
â”‚   â”œâ”€â”€ strategies/
â”‚   â”‚   â”œâ”€â”€ jwt.strategy.ts          # JwtStrategy: valida token, verifica activo en BD
â”‚   â”‚   â””â”€â”€ google.strategy.ts       # GoogleStrategy: valida perfil Google, llama findOrCreateGoogleUser()
â”‚   â”œâ”€â”€ guards/
â”‚   â”‚   â”œâ”€â”€ jwt-auth.guard.ts        # JwtAuthGuard: wrapper AuthGuard('jwt')
â”‚   â”‚   â””â”€â”€ google-auth.guard.ts     # GoogleAuthGuard: wrapper AuthGuard('google')
â”‚   â”œâ”€â”€ entities/
â”‚   â”‚   â”œâ”€â”€ password-reset-token.entity.ts  # Token recuperaciÃ³n contraseÃ±a (1h)
â”‚   â”‚   â””â”€â”€ refresh-token.entity.ts         # Refresh token (30 dÃ­as, rotaciÃ³n)
â”‚   â”œâ”€â”€ token-cleanup.service.ts     # @Cron(EVERY_DAY_AT_3AM) â€” limpia refresh+reset tokens expirados
â”‚   â””â”€â”€ dto/login.dto.ts + forgot-password.dto.ts + reset-password.dto.ts + cambiar-password.dto.ts
â”‚
â”œâ”€â”€ common/                          # Utilidades transversales
â”‚   â”œâ”€â”€ autorizacion.module.ts       # @Global() â€” provee MenuRolGuard + SuscripcionGuard
â”‚   â”œâ”€â”€ guards/
â”‚   â”‚   â”œâ”€â”€ api-key.guard.ts         # Guard X-API-KEY (departamento, ciudad)
â”‚   â”‚   â”œâ”€â”€ menu-rol.guard.ts        # Consulta menu_rol por rol+menÃº+mÃ©todo HTTP
â”‚   â”‚   â””â”€â”€ suscripcion.guard.ts     # Bloquea si suscripcion CANCELADA sin trial vigente
â”‚   â”œâ”€â”€ decorators/
â”‚   â”‚   â”œâ”€â”€ current-user.decorator.ts  # @CurrentUser() â†’ request.user del JWT
â”‚   â”‚   â””â”€â”€ permiso.decorator.ts       # @RequierePermiso('/ruta')
â”‚   â”œâ”€â”€ dto/
â”‚   â”‚   â””â”€â”€ paginacion.dto.ts          # page (default 1), limit (default 20, max 100)
â”‚   â”œâ”€â”€ interfaces/
â”‚   â”‚   â””â”€â”€ paginated-result.interface.ts  # { data, total, page, limit, totalPages }
â”‚   â””â”€â”€ notifications/
â”‚
â”œâ”€â”€ gestion/
â”‚   â”œâ”€â”€ personas/                    # JWT + MenuRol
â”‚   â”œâ”€â”€ usuarios/                    # JWT + MenuRol â€” re-hashea password en PATCH
â”‚   â””â”€â”€ persona-documentos/          # JWT + MenuRol
â”‚
â”œâ”€â”€ negocio/
â”‚   â”œâ”€â”€ contribuyentes/              # JWT + MenuRol â€” valida RUC duplicado
â”‚   â”œâ”€â”€ comprobantes/                # JWT + MenuRol â€” CRUD + bolsa revisiÃ³n
â”‚   â”œâ”€â”€ comprobantes-ventas/         # JWT + MenuRol â€” CRUD + bolsa revisiÃ³n
â”‚   â”œâ”€â”€ asignaciones-contables/      # JWT + MenuRol
â”‚   â”œâ”€â”€ exportaciones/               # JWT + MenuRol â€” CSV RG90
â”‚   â”œâ”€â”€ suscripciones/               # JWT + MenuRol
â”‚   â”œâ”€â”€ cuotas-pagos/                # JWT + MenuRol
â”‚   â””â”€â”€ ocr-tax/                     # JWT + MenuRol + capa 2 (asignaciones)
â”‚       â”œâ”€â”€ services/image-optimization / ocr-engine / google-vision / regex-parser / tax-validation
â”‚       â”œâ”€â”€ helpers/ocr-normalizer / clasificador-gasto
â”‚       â””â”€â”€ entities/set-ruc / ocr-entrenamiento
â”‚
â””â”€â”€ referenciales/
    â”œâ”€â”€ geograficos/pais / departamento / ciudad
    â””â”€â”€ parametros/roles / menu / grupo-menu / menu-rol / tipos-documento
```

---

## 4. Mapa de endpoints y guards

### Auth (pÃºblico / protegido)
| MÃ©todo | Ruta | Guard | Notas |
|---|---|---|---|
| POST | `/auth/login` | PÃºblico | Rate limit: 5/min. Devuelve `access_token` + `refresh_token` |
| POST | `/auth/register` | JWT + MenuRol (`/usuarios`) | Crea usuario, envÃ­a email de bienvenida |
| GET | `/auth/me` | JWT | Perfil del usuario autenticado |
| POST | `/auth/refresh` | PÃºblico | Rota refresh token, devuelve nuevos tokens |
| POST | `/auth/logout` | JWT | Revoca refresh token |
| POST | `/auth/forgot-password` | PÃºblico | EnvÃ­a email con token 64hex (1h) |
| POST | `/auth/reset-password` | PÃºblico | Usa token del email, actualiza password |
| POST | `/auth/cambiar-password` | JWT | Cambia password conociendo la actual |
| GET | `/auth/google` | PÃºblico (GoogleAuthGuard) | Redirige al selector de cuenta Google |
| GET | `/auth/google/callback` | PÃºblico (GoogleAuthGuard) | Callback OAuth â€” crea usuario si no existe, redirige al frontend con tokens |

### GestiÃ³n
| MÃ©todo | Ruta | Guard |
|---|---|---|
| CRUD | `/personas` | JWT + MenuRol |
| CRUD | `/persona-documentos` | JWT + MenuRol |
| CRUD | `/usuarios` | JWT + MenuRol |

### Negocio tributario
| MÃ©todo | Ruta | Guard |
|---|---|---|
| CRUD | `/negocio/contribuyentes` | JWT + MenuRol |
| CRUD + bolsa | `/negocio/comprobantes` | JWT + MenuRol + SuscripcionGuard (POST) |
| CRUD + bolsa | `/negocio/comprobantes-ventas` | JWT + MenuRol + SuscripcionGuard (POST) |
| CRUD | `/negocio/asignaciones-contables` | JWT + MenuRol |
| POST | `/ocr-tax/extraer/compra` | JWT + MenuRol + capa 2 (asignacion) + capa 3 (suscripcion) |
| POST | `/ocr-tax/extraer/venta` | JWT + MenuRol + capa 2 (asignacion) + capa 3 (suscripcion) |
| GET | `/negocio/exportaciones/rg90/compras` | JWT + MenuRol + SuscripcionGuard |
| GET | `/negocio/exportaciones/rg90/ventas` | JWT + MenuRol + SuscripcionGuard |

### Cobranzas SaaS
| MÃ©todo | Ruta | Guard |
|---|---|---|
| CRUD | `/cobranzas/suscripciones` | JWT + MenuRol |
| CRUD | `/cobranzas/cuotas-pagos` | JWT + MenuRol |

### ConfiguraciÃ³n del sistema (solo JWT â€” sin MenuRolGuard para evitar bootstrap)
| MÃ©todo | Ruta | Guard |
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

### Tres capas
**Capa 1 â€” MenuRolGuard** (`src/common/guards/menu-rol.guard.ts`)
- JWT vÃ¡lido + `usuario.activo = true` (JwtStrategy lo verifica en BD)
- Mapeo HTTP â†’ flag: `GETâ†’listar`, `POSTâ†’guardar`, `PATCH/PUTâ†’editar`, `DELETEâ†’eliminar`
- Consulta `menu_rol` por `rol_id + menu.url`
- Default deny

**SuscripcionGuard** (`src/common/guards/suscripcion.guard.ts`)
- Lee `contribuyente_id` del body o query
- Bloquea (403) si suscripcion estÃ¡ CANCELADA Y no tiene trial vigente (`es_trial=true AND trial_hasta >= hoy`)
- Aplicado en: `POST /negocio/comprobantes`, `POST /negocio/comprobantes-ventas`, `GET /negocio/exportaciones/rg90/compras`, `GET /negocio/exportaciones/rg90/ventas`

**Capa 2 â€” OCR: asignaciÃ³n contable** (`ocr-tax.controller.ts`)
- Verifica `asignaciones_contables` para el RUC enviado
- Si no hay asignaciÃ³n â†’ 403

**Capa 3 â€” OCR: suscripciÃ³n** (`ocr-tax.controller.ts`)
- Verifica suscripciÃ³n activa o trial vigente del contribuyente resuelto
- Si estÃ¡ CANCELADA sin trial â†’ 403

### Rate limiting (`@nestjs/throttler`)
- Global: 100 req/min por IP (`ThrottlerGuard` como `APP_GUARD` en `AppModule`)
- Login: 5 req/min por IP (`@Throttle({ default: { limit: 5, ttl: 60000 } })` en el endpoint)

### Flujo de validaciÃ³n global
```
request â†’ ThrottlerGuard (429) â†’ JwtAuthGuard â†’ JwtStrategy (activo en BD) â†’ MenuRolGuard â†’ handler
                                  â†“ 401                                        â†“ 403
```

### ValidationPipe global (`main.ts`)
```typescript
whitelist: true              // elimina propiedades extra del body
forbidNonWhitelisted: true   // retorna 400 si llegan propiedades no declaradas
transform: true
```

### CORS
Variable de entorno `CORS_ORIGIN`. Default dev: `localhost:3000`, `localhost:4200`.
ProducciÃ³n: `CORS_ORIGIN=https://mifrontend.com`

---

## 6. Modelos y tablas â€” Estado actual vs schema

La base de datos tiene el schema definido en `schema_bd_sis_iva.sql` (ignorado por git).

### Tablas implementadas como entidades TypeORM
> ⚠️ **Corregido P0.7** C5: histÃ³rico; ver nota C5 en Â§8.

| Tabla BD | Entidad | Notas |
|---|---|---|
| `paises` | `Pais` | âœ… |
| `departamentos` | `Departamento` | âœ… |
| `ciudades` | `Ciudad` | âœ… |
| `personas` | `Persona` | âœ… (`email_contacto`, timestamps: ausentes en entidad Y en schema â€” mejora futura) |
| `tipos_documento` | `TipoDocumento` | âœ… |
| `persona_documentos` | `PersonaDocumento` | âœ… (incluye `fecha_vencimiento` en ambos) |
| `roles` | `Role` | âœ… |
| `usuarios` | `Usuario` | âœ… (campo `fecha_creacion` â€” mismo nombre en entidad y schema) |
| `grupo_menu` | `GrupoMenu` | âœ… (tiene `descripcion` e `icono` en ambos; sin `orden`/`activo` en ambos) |
| `menu` | `Menu` | âœ… (tiene `descripcion` e `icono` en ambos; sin `orden`/`activo` en ambos) |
| `menu_rol` | `MenuRol` | âœ… (UNIQUE `menu_id+rol_id` en ambos) |
| `contribuyentes` | `Contribuyente` | âœ… (`deleted_at` presente; `activo` y `updated_at` ausentes en entidad Y en schema) |
| `asignaciones_contables` | `AsignacionContable` | âœ… |
| `comprobantes` | `Comprobante` | âœ… (`revisor_id`, `fecha_reclamado` y `deleted_at` en entidad y schema) |
| `comprobantes_ventas` | `ComprobanteVenta` | âœ… (`deleted_at` agregado; `tipo_identificacion_cliente` no existe en schema) |
| `set_rucs` | `SetRuc` | âœ… (`created_at`/`updated_at`: ausentes en entidad Y en schema) |
| `ocr_entrenamientos` | `OcrEntrenamiento` | âœ… (UNIQUE para comprobante_id Y comprobante_venta_id en ambos) |
| `suscripciones` | `Suscripcion` | âœ… |
| `cuotas_pagos` | `CuotaPago` | âœ… |

### Tablas SET â€” no existen en el schema actual
Los catÃ¡logos SET (`set_tipo_comprobante`, `set_condicion_operacion`, `set_tipo_identificacion`, `set_tipo_registro`, `set_valor_logico`) **no estÃ¡n en el schema actual ni tienen entidades TypeORM**. Los valores se validan a nivel DTO en la API. No hay FK activas hacia tablas SET â€” no bloquean inserts de comprobantes.

### URLs de menÃº registradas en BD (deben coincidir con `@RequierePermiso`)
```
menu_id=1  â†’ /negocio/comprobantes
menu_id=2  â†’ /negocio/contribuyentes
menu_id=3  â†’ /negocio/exportaciones
menu_id=4  â†’ /ocr-tax
menu_id=5  â†’ /negocio/asignaciones-contables
menu_id=6  â†’ /usuarios
menu_id=7  â†’ /roles
menu_id=8  â†’ /menu
menu_id=9  â†’ /grupo-menu
menu_id=10 â†’ /menu-rol
menu_id=11 â†’ /cobranzas/suscripciones
menu_id=12 â†’ /cobranzas/cuotas-pagos
menu_id=13 â†’ /personas
menu_id=14 â†’ /persona-documentos
menu_id=15 â†’ /tipos-documento
menu_id=16 â†’ /pais
menu_id=17 â†’ /negocio/comprobantes-ventas
```

> âš ï¸ El schema SQL tiene un seed de menÃºs con URLs distintas (`/comprobantes/compras`, `/contribuyentes`, etc.). Si se aplica ese seed, rompe el `MenuRolGuard`. Usar Ãºnicamente las URLs de la tabla de arriba.

---

## 7. LÃ³gica de negocio importante

### AutenticaciÃ³n y gestiÃ³n de contraseÃ±as (`/auth`)

**Login** devuelve `{ access_token, refresh_token, user }`. El `access_token` dura 8h (JWT), el `refresh_token` dura 30 dÃ­as (BD).

**Refresh token** implementa rotaciÃ³n: cada `/auth/refresh` invalida el token anterior y emite uno nuevo. Si el token es robado y ya fue rotado, el intento falla con 401.

**Tabla `password_reset_tokens`:** token 64hex, expira en 1h, marcado como `usado` tras el reset. Se invalidan tokens anteriores del mismo usuario en cada nueva solicitud.

**Tabla `refresh_tokens`:** token 64hex, expira en 30 dÃ­as, campo `revocado`. Se revoca en logout y se rota en cada refresh.

### Pipeline OCR (`/ocr-tax`)
1. JWT + `activo` (JwtStrategy)
2. `permitir_guardar` en `/ocr-tax` (MenuRolGuard)
3. RUC existe como contribuyente
4. `asignaciones_contables` vÃ¡lida (capa 2)
5. SuscripciÃ³n activa o trial vigente (capa 3) â€” bloquea si CANCELADA sin trial
6. Buffer no vacÃ­o, MIME = JPG/PNG/WebP, tamaÃ±o â‰¤ 5 MB
6. sharp â†’ WebP â†’ Cloudflare R2
7. Tesseract.js (primario) â†’ si confianza < 75% o faltan campos â†’ Google Vision (fallback)
8. RegexParserService extrae campos fiscales
9. InvoiceParaguayValidatorService valida: cuadratura matemÃ¡tica, formato timbrado, total > 0
- `GET .../bolsa/pendientes` â€” lista `estado_ocr='REQUIERE_REVISION'` sin `revisor_id` â€” responde `PaginatedResult` con `?page=&limit=`
- `POST .../bolsa/:id/reclamar` â€” asigna el comprobante al `usuario.id` del JWT
- Protege contra doble reclamo concurrente
- Al hacer `PATCH` con `estado_ocr: 'VERIFICADO_HUMANO'` â†’ actualiza `ocr_entrenamientos` con `json_humano` y marca `LISTO_PARA_ENTRENAR` (en compras y ventas)

### Google OAuth2 (`/auth/google`)

**Flujo completo:**
1. Frontend redirige al usuario a `GET /auth/google`
2. Passport redirige a Google (selector de cuenta)
3. Google autentica y llama `GET /auth/google/callback`
4. `GoogleStrategy.validate()` recibe el perfil y llama `findOrCreateGoogleUser()`
5. Si el usuario no existe â†’ se crea con rol **Contador (id=2)** y password aleatorio (bcrypt, nunca expuesto)
6. Si ya existe â†’ se retorna el usuario existente con relaciones cargadas
7. La API redirige al frontend a `GOOGLE_REDIRECT_FRONTEND_URL/auth/google/callback?access_token=...&refresh_token=...`

> ⚠️ **Corregido P0.7** C2: OAuth no auto-crea usuarios; el cÃ³digo actual todavÃ­a auto-crea (findOrCreateGoogleUser) â†’ pendiente P1a.8a.

**Consideraciones:**
- Usuarios Google se crean **sin documento de identidad** (no aplica para OAuth)
- El password almacenado es un hash de 64 bytes aleatorios â€” nunca se puede usar para login por contraseÃ±a
- El rol por defecto es Contador (id=2). Se puede cambiar posteriormente con `PATCH /usuarios/:id`
- `GOOGLE_CALLBACK_URL` debe estar registrada como URI autorizada en Google Cloud Console

> ⚠️ **Corregido P0.7** C3: comportamiento actual inseguro, pendiente P1a.8b.

### Email â€” 2 plantillas activas (`NotificationsService` vÃ­a SMTP Hostinger)
> ⚠️ **Corregido P0.7** C12: Email provider real ausente, solo logueo local actual.
| MÃ©todo | CuÃ¡ndo se llama |
|---|---|
| `sendBienvenidaEmail` | Al crear usuario con `es_temporal: false` (no aplica a usuarios Google) |
| `sendResetPasswordEmail` | Al solicitar recuperaciÃ³n de contraseÃ±a |

---

## 8. Estado actual â€” Resumen de todo lo implementado

### Seguridad
- `JwtStrategy` verifica firma, BD y `activo`
- `JwtAuthGuard` en todos los endpoints
- `MenuRolGuard` en datos de negocio
- `SuscripcionGuard` en POST comprobantes/comprobantes-ventas y GET exportaciones â€” bloquea si suscripcion CANCELADA sin trial
- `@RequierePermiso` declarado en cada controller
- `POST /auth/register` protegido con JWT + permiso guardar `/usuarios`
- Capa 2 OCR: `asignaciones_contables` validada en ambos endpoints
- Capa 3 OCR: suscripciÃ³n verificada inline en ambos endpoints
- `console.log` de contraseÃ±as eliminado
- ID hardcodeado `999` eliminado
- Re-hash de password en PATCH usuarios

### Validaciones y producciÃ³n
> ⚠️ **Corregido P0.7** C9: Estados OCR validados.
- `synchronize: false` â€” BD no se altera al arrancar
- `whitelist: true` + `forbidNonWhitelisted: true` â€” body estricto
- CORS con `CORS_ORIGIN` por env var
- MIME + 5 MB en FileInterceptor OCR
- ValidaciÃ³n matemÃ¡tica fiscal en `extraerVenta`
- DTOs con `@Matches`, `@Length`, `@Min`, `@IsIn(['S','N'])`, `@IsIn([tipos SET])`
- `remove()` consistente en todos los services â€” retorna `{ message }`
- RUC duplicado â†’ `ConflictException`
- FK errors â†’ `BadRequestException` descriptivo
- `estado_ocr` con 6 estados en `comprobante.entity.ts`
- `created_at` en comprobante entity (migraciÃ³n aplicada)

### BD configurada y ejecutada (2026-06-05) â€” estado final âœ…
- 22 tablas â€” schema aplicado en MySQL 8.0 local. Listo para servidor.
- 5 grupos de menÃº, 17 menÃºs, 41 registros `menu_rol`
- Roles: 1=Administrador (LGED en todo), 2=Contador (acceso operativo), 3=Solo Lectura (consulta)
- charset `utf8mb4` en conexiÃ³n TypeORM
> ⚠️ **Corregido P0.7** C11: admin inicial se crea con `npm run bootstrap:admin` (ver `.ai-work/BOOTSTRAP_ADMIN.md`); credenciales históricas retiradas, rotación P1a.4
- Tablas activas: `refresh_tokens`, `password_reset_tokens`
- Soft delete activo: `deleted_at` en `contribuyentes`, `comprobantes`, `comprobantes_ventas`
- CorrecciÃ³n aplicada: eliminado CHECK constraint en `ocr_entrenamientos` (incompatible con MySQL 8.0 + FK)
> ⚠️ **Corregido P0.7** C5: histÃ³rico 2026-06 (MySQL 8 local). Baseline versionado: 21 tablas; catÃ¡logos vigentes 37 `menu_rol` (`npm run seed:catalogs`). Motor objetivo MariaDB 11.8.x (D23); runtime contra MariaDB aÃºn no validado. Autoridad: `.ai-work/SCHEMA_INVENTORY.md`, `.ai-work/DB_ENGINE_COMPATIBILITY.md` (D23).

### MÃ³dulos completos â€” estado final âœ…
> ⚠️ **Corregido P0.7** C10: Filtros y paginación.
- CRUD: personas, usuarios, documentos, contribuyentes, comprobantes (compras y ventas), asignaciones, suscripciones, cuotas, roles, menÃºs, grupos, tipos-documento, paÃ­ses
- OCR pipeline: Tesseract + Vision + validaciÃ³n fiscal + R2. Compra y venta en paridad de campos fiscales (gravada_5, exenta, iva_10, iva_5, imputa_*)
- ExportaciÃ³n RG90 compras y ventas + SuscripcionGuard en ambos endpoints
- **Bolsa de revisiÃ³n** para compras y ventas
> ⚠️ **Corregido P0.7** C7: Bolsa de revisión documentada.
 â€” paginada (`PaginatedResult`). `update()` ventas sincroniza `OcrEntrenamiento` al verificar (`VERIFICADO_HUMANO`)
- **PaginaciÃ³n completa**: todos los `GET` de listado devuelven `{ data, total, page, limit, totalPages }`. `?page=1&limit=20`. Aplica en todos los mÃ³dulos de negocio
- **Filtro `?estado_ocr=`** en `GET /negocio/comprobantes` y `GET /negocio/comprobantes-ventas`
- `findOne` en comprobantes-ventas carga relaciÃ³n `contribuyente`
- Rate limiting: 100 req/min global, 5 req/min en `/auth/login`
- Refresh token: login devuelve `access_token` (8h) + `refresh_token` (30d). `/auth/refresh` rota. `/auth/logout` revoca
- **TokenCleanupService**: cron `@EVERY_DAY_AT_3AM` elimina tokens expirados
- Soft delete: `comprobantes`, `comprobantes_ventas`, `contribuyentes` â€” `DELETE` usa `softDelete()`, invisible para `find()`
- GET /auth/me: perfil completo del usuario autenticado
- **SuscripcionGuard**: bloquea POST comprobantes/ventas y GET exportaciones si suscripcion CANCELADA sin trial vigente
- **Free trial**: `es_trial` + `trial_hasta` en `suscripciones`

### Email â€” estado del mÃ³dulo
- LibrerÃ­as: `@nestjs-modules/mailer` ^2.0.1, `nodemailer` ^8.0.5, `handlebars` ^4.7.9
- SMTP configurado en `.env`: Hostinger puerto 465 SSL (`contacto@acbldeveloper.com`)
- `NotificationsModule` global con `SmtpEmailProvider` vÃ­a `MailerModule` (Firebase eliminado)
- **`secure`** leÃ­do de `MAIL_SECURE` env var â€” `'true'` activa SSL (puerto 465), `'false'` usa STARTTLS (puerto 587)
- Email de bienvenida enviado fire-and-forget al crear usuario (`es_temporal: false`) â€” NO aplica a usuarios Google
- Email de reset enviado fire-and-forget en `forgot-password` â€” template HTML con cÃ³digo 64hex destacado

### Google OAuth2 â€” estado del mÃ³dulo
- LibrerÃ­a: `passport-google-oauth20` + `@types/passport-google-oauth20`
- `GoogleStrategy` registrada en `AuthModule`
- Nuevos endpoints: `GET /auth/google` y `GET /auth/google/callback`
- `findOrCreateGoogleUser()` en `UsuariosService` â€” crea persona sin documentos, password aleatorio bcrypt
- Variables requeridas en `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `GOOGLE_REDIRECT_FRONTEND_URL`
- Pendiente: completar credenciales en Google Cloud Console y llenar las variables del `.env` (âš ï¸ **Corregido P0.7** no configurar hasta P1a.8d, D2).

---

## 9. Cobranzas SaaS â€” Estado y anÃ¡lisis

### Lo que SÃ estÃ¡ implementado
- `suscripciones`: registro de estado (ACTIVO / MOROSO / CANCELADO) + `es_trial` + `trial_hasta` + `created_at`
- `cuotas_pagos`: registro de cuotas con monto, vencimiento, fecha de pago, estado (PENDIENTE / PAGADO / VENCIDO)
- CRUD completo con JWT + MenuRolGuard + paginaciÃ³n
- `SuscripcionGuard`: bloquea automÃ¡ticamente si `estado=CANCELADO` sin trial vigente
- Free trial: al crear suscripcion con `es_trial: true` y `trial_hasta: "YYYY-MM-DD"`, el contribuyente opera durante ese perÃ­odo aunque la suscripcion estÃ© CANCELADA

### Lo que NO estÃ¡ implementado
| Concepto | Estado |
|---|---|
| Plan/tier del servicio (bÃ¡sico, premium, enterprise) | âŒ No existe tabla `planes` |
| LÃ­mites por plan (mÃ¡x. comprobantes por mes, usuarios, contribuyentes) | âŒ Sin lÃ³gica de cuotas de uso |
| Estado de cuenta visible para el contribuyente | âŒ Sin endpoint de resumen |
| FacturaciÃ³n automÃ¡tica (generar cuotas al renovar) | âŒ Manual |
| Bloqueo automÃ¡tico en exportaciones | âœ… Implementado â€” SuscripcionGuard en ambos GET rg90 |

---

## 10. Pendiente / Gaps funcionales

### Verificado 2026-06-05 â€” entidades y schema 100% sincronizados
No hay desincronizaciÃ³n entre entidades TypeORM y el schema SQL. Los campos "faltantes" (email_contacto, activo en contribuyentes, timestamps opcionales, etc.) estÃ¡n consistentemente ausentes en ambos lados. Son mejoras futuras, no bugs.
> ⚠️ **Corregido P0.7** C5: histÃ³rico; ver nota C5 en Â§8.

### Gaps funcionales pendientes (post 2026-06-05)
> ⚠️ **Corregido P0.7** C14: Servicios futuros en ROADMAP.

| Gap | Impacto | Esfuerzo |
|---|---|---|
| **MÃ³dulo de planes/tiers** â€” tabla `planes` + lÃ­mites por plan | Alto para SaaS real | Alto |
| **`email_contacto` en personas** â€” ausente en entidad y schema | Bajo â€” el login usa `usuarios.email` | Bajo |
| **`comprobante_asociado/timbrado_asociado` en ventas** â€” solo en compras | Medio â€” notas crÃ©dito/dÃ©bito de ventas | Bajo |
| **AuditorÃ­a de cambios** (`updated_at`, `updated_by`) en comprobantes | Medio | Medio |

### Para levantar en un servidor nuevo (listo âœ…)

> ⚠️ **Corregido P0.7** C4: Retirado. Baseline 21 tablas,  `npm run seed:catalogs` 37 menu_rol,  `npm run bootstrap:admin`.

> **MySQL 8.0** â€” Se removiÃ³ el CHECK constraint de `ocr_entrenamientos` (incompatible con FK en MySQL 8.0). No se pueden usar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (sintaxis MariaDB). Para actualizar BD existente, usar los `ALTER TABLE` sin `IF NOT EXISTS` comentados al final del script.

---

## 11. Convenciones del cÃ³digo

- **NestJS module-first**: `XxxModule`, `XxxController`, `XxxService`, `xxx.entity.ts`, `create-xxx.dto.ts` / `update-xxx.dto.ts`
- **Nombres**: BD en `snake_case`; TypeScript en `camelCase`; clases en `PascalCase`
- **Guards por tipo**:
  - Negocio â†’ `@UseGuards(JwtAuthGuard, MenuRolGuard)` + `@RequierePermiso('/ruta')`
  - ConfiguraciÃ³n sistema â†’ `@UseGuards(JwtAuthGuard)` solamente
  - Geo carga masiva â†’ `@UseGuards(ApiKeyGuard)`
  - Login â†’ sin guard
- **Transacciones**: `QueryRunner` para operaciones multi-tabla
- **Relaciones `eager: true`** en `Usuario.persona`, `Usuario.rol`, `Persona.documentos`
- **`@CurrentUser()`** â†’ `{ id, email, rol: { id, nombre } }`
- **Errores estÃ¡ndar**: `NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException`
- **remove()** â†’ siempre retorna `{ message: '...' }`

---

## 12. Variables de entorno requeridas

```env
PORT=9031                       # Puerto del servidor (opcional â€” default: 9031)

DB_HOST=
DB_PORT=3306
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=bd_sis_iva

JWT_SECRET=
JWT_EXPIRATION=8h

CORS_ORIGIN=http://localhost:3000

API_KEY=                        # Para endpoints ApiKeyGuard (departamento, ciudad)

# Google OAuth2
GOOGLE_CLIENT_ID=               # Desde Google Cloud Console â†’ Credenciales â†’ OAuth 2.0
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api-qa.acbldeveloper.com/auth/google/callback
GOOGLE_REDIRECT_FRONTEND_URL=http://localhost:3000  # URL base del frontend

# Cloudflare R2
R2_ENDPOINT=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# SMTP (Hostinger â€” puerto 465 SSL)
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_SECURE=true                # true para puerto 465, false para 587
MAIL_USER=                      # cuenta de email Hostinger
MAIL_PASS=                      # contraseÃ±a
MAIL_FROM=                      # "Nombre <cuenta@dominio.com>"
MAIL_IGNORE_TLS=false           # true solo para certificados auto-firmados en dev
```
> ⚠️ **Corregido P0.7** C13: sin API_KEY â†’ 401 (fail-closed, P0.3). Autoridad: `.ai-work/TASKS.md` (P0.3).

---

## 13. DocumentaciÃ³n y colecciÃ³n Postman
> ⚠️ **Corregido P0.7** C16: Docs históricos.

### ColecciÃ³n Postman
Archivo: `collection/Facturacion-IVA.postman_collection.json` (en `.gitignore`)

Formato Postman v2.1.0 â€” **100+ requests en 20 carpetas** cubriendo todos los mÃ³dulos:
Auth, Personas, Usuarios, Persona Documentos, Contribuyentes, Comprobantes Compra, Comprobantes Venta, OCR (multipart/form-data), Exportaciones RG90, Asignaciones Contables, Suscripciones, Cuotas de Pago, Roles, MenÃº, Grupo MenÃº, Menu-Rol, Tipos de Documento, PaÃ­s (JWT), Departamento (ApiKey), Ciudad (ApiKey).

Variables de colecciÃ³n: `baseUrl=http://localhost:9031`, `token=` (completar con access_token del login), `apiKey=`

> ⚠️ **Corregido P0.7** C6/C8/C10/R9: credenciales de prueba retiradas, usar  `npm run bootstrap:admin`.

### DocumentaciÃ³n de endpoints
Archivo: `API_ENDPOINTS.md` â€” documentaciÃ³n completa de todos los mÃ³dulos con:
- MÃ©todo HTTP, ruta, guards aplicados
- Tabla de campos del body con tipo y validaciÃ³n
- Ejemplo de body completo (JSON)
- Respuesta exitosa y cÃ³digos de error posibles
- Ejemplos de query params para paginaciÃ³n y filtros

### GuÃ­a tÃ©cnica completa del sistema
Archivo: `SISTEMA_IVA_GUIA.md` â€” documento de referencia para implementadores con:
- QuÃ© hace el sistema y modelo SaaS
- Base de datos: las 22 tablas + datos insertados por el seed (grupos, menÃºs, 41 permisos, roles, admin)
- Sistema de seguridad en capas con diagramas y SQL de los guards
- Flujo completo de usuarios, roles y permisos
- Pipeline OCR paso a paso para compra y venta
- Bolsa de revisiÃ³n: flujo completo
- ExportaciÃ³n RG90 y formato CSV Marangatu
- Suscripciones y free trial
- ImplementaciÃ³n frontend web (interceptores, menÃº dinÃ¡mico, manejo de errores)
- ImplementaciÃ³n app mÃ³vil (cÃ¡mara, SecureStorage, flujo offline)
- GuÃ­a de testing paso a paso con todos los flujos crÃ­ticos


