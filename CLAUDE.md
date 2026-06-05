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
│   ├── auth.controller.ts           # POST /auth/login (público) — /auth/register (JWT+MenuRol)
│   ├── auth.module.ts
│   ├── auth.service.ts              # validateUser, login (genera JWT)
│   ├── strategies/jwt.strategy.ts   # JwtStrategy: valida token, verifica activo en BD
│   ├── guards/jwt-auth.guard.ts     # JwtAuthGuard: wrapper AuthGuard('jwt')
│   └── dto/login.dto.ts
│
├── common/                          # Utilidades transversales
│   ├── autorizacion.module.ts       # @Global() — provee MenuRolGuard
│   ├── guards/
│   │   ├── api-key.guard.ts         # Guard X-API-KEY (departamento, ciudad)
│   │   └── menu-rol.guard.ts        # Consulta menu_rol por rol+menú+método HTTP
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser() → request.user del JWT
│   │   └── permiso.decorator.ts       # @RequierePermiso('/ruta')
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
| Método | Ruta | Guard |
|---|---|---|
| POST | `/auth/login` | Público |
| POST | `/auth/register` | JWT + MenuRol (`/usuarios`) |

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

### Flujo de validación global
```
request → JwtAuthGuard → JwtStrategy (verifica activo en BD) → MenuRolGuard (menu_rol) → handler
          ↓ 401                                               ↓ 403
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
| Tabla BD | Entidad | Notas |
|---|---|---|
| `paises` | `Pais` | ✅ |
| `departamentos` | `Departamento` | ✅ |
| `ciudades` | `Ciudad` | ✅ |
| `personas` | `Persona` | ⚠️ Faltan `email_contacto`, `created_at`, `updated_at` en entidad |
| `tipos_documento` | `TipoDocumento` | ✅ |
| `persona_documentos` | `PersonaDocumento` | ✅ |
| `roles` | `Role` | ⚠️ Falta `created_at` en entidad |
| `usuarios` | `Usuario` | ✅ |
| `grupo_menu` | `GrupoMenu` | ⚠️ Faltan `orden` y `activo` en entidad |
| `menu` | `Menu` | ⚠️ Faltan `orden` y `activo` en entidad |
| `menu_rol` | `MenuRol` | ✅ |
| `contribuyentes` | `Contribuyente` | ⚠️ Faltan `activo` y `updated_at` en entidad |
| `asignaciones_contables` | `AsignacionContable` | ✅ |
| `comprobantes` | `Comprobante` | ⚠️ Falta `updated_at`; `revisor_id` / `fecha_reclamado` en entidad pero NO en schema |
| `comprobantes_ventas` | `ComprobanteVenta` | ⚠️ `tipo_identificacion_cliente` en schema pero no en entidad |
| `set_rucs` | `SetRuc` | ⚠️ Faltan `created_at` y `updated_at` en entidad |
| `ocr_entrenamientos` | `OcrEntrenamiento` | ✅ |
| `suscripciones` | `Suscripcion` | ✅ |
| `cuotas_pagos` | `CuotaPago` | ✅ |

### Tablas SET del schema — NO implementadas como entidades
| Tabla | Propósito | Estado |
|---|---|---|
| `set_tipo_registro` | Catálogo 1=Ventas, 2=Compras, 3=Ingresos, 4=Egresos | ❌ Sin entidad ni endpoint |
| `set_condicion_operacion` | 1=Contado, 2=Crédito | ❌ Sin entidad ni endpoint |
| `set_tipo_identificacion` | 11=RUC, 12=CI, etc. | ❌ Sin entidad ni endpoint |
| `set_tipo_comprobante` | 109=Factura, 112=Ticket, etc. | ❌ Sin entidad ni endpoint |
| `set_valor_logico` | S/N | ❌ Sin entidad ni endpoint |

**Consecuencia importante:** el schema define FK desde `comprobantes` → `set_tipo_comprobante`, `set_condicion_operacion`, `set_valor_logico`. Si la BD tiene esas constraints activas, la API no puede insertar comprobantes sin que esas tablas estén pobladas.

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

### BD configurada
- 5 grupos de menú, 17 menús, 29 registros `menu_rol`
- Roles: 1=Administrador (`LGED` en todo), 2=Contador (acceso operativo)
- charset `utf8mb4` en conexión TypeORM

### Módulos completos
- CRUD: personas, usuarios, documentos, contribuyentes, comprobantes (compras y ventas), asignaciones, suscripciones, cuotas, roles, menús, grupos, tipos-documento, países
- OCR pipeline: Tesseract + Vision + validación fiscal + R2
- Exportación RG90 compras y ventas
- Bolsa de revisión para compras y ventas

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

## 10. Pendiente / Gaps detectados en el repaso del schema

### Entidades desincronizadas con el schema SQL
1. **`persona.email_contacto`** — en schema, ausente en entidad
2. **`persona.created_at / updated_at`** — en schema, ausente en entidad
3. **`roles.created_at`** — en schema, ausente en entidad
4. **`grupo_menu.orden`, `grupo_menu.activo`** — en schema, ausentes en entidad y DTO
5. **`menu.orden`, `menu.activo`** — en schema, ausentes en entidad y DTO
6. **`contribuyentes.activo`** — en schema, ausente en entidad (importante para soft delete)
7. **`contribuyentes.updated_at`** — en schema, ausente en entidad
8. **`comprobantes_ventas.tipo_identificacion_cliente`** — en schema (FK a `set_tipo_identificacion`), ausente en entidad
9. **`comprobantes.revisor_id / fecha_reclamado`** — en entidad (bolsa feature) pero NO en schema SQL

### Tablas SET no implementadas
Las 5 tablas de catálogos SET (`set_tipo_registro`, `set_condicion_operacion`, `set_tipo_identificacion`, `set_tipo_comprobante`, `set_valor_logico`) existen en el schema pero no tienen entidades TypeORM ni endpoints. Si el schema SQL fue aplicado con las FK activas, la API necesita que esas tablas estén pobladas para poder insertar comprobantes.

### Otros pendientes
- Sin paginación en endpoints de lista
- Sin rate limiting en `/auth/login`
- Sin refresh token
- Sin soft delete — borrado físico con CASCADE
- Sin bloqueo automático por estado de suscripción
- Sin módulo de planes/tiers para SaaS premium
- Sin período de prueba (free trial)
- Sin reporte/dashboard de uso

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
```

---

## 13. Colección Postman

Archivo: `collection/Facturacion-IVA.postman_collection.json` (en `.gitignore`)

Variables: `baseUrl=http://localhost:9031`, `token=` (access_token del login), `apiKey=`

Credenciales de prueba: `antonio@demo.com` / `123456`
