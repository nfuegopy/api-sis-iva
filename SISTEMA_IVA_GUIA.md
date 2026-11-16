# Sistema de FacturaciÃ³n IVA Paraguay â€” GuÃ­a TÃ©cnica Completa

> ⚠️ **Corregido P0.7** C1: Autoridad .ai-work (vigente).

**API Base URL QA:** `https://api-qa.acbldeveloper.com`  
**API Base URL local:** `http://localhost:9031` (puerto configurable vÃ­a `PORT` env var)  
**Stack:** NestJS 11 Â· TypeORM 0.3 Â· MySQL 8.0 Â· JWT Â· Google OAuth2 Â· Tesseract.js Â· Google Vision Â· Cloudflare R2  
**Fecha:** 2026-06-06

---

## Tabla de contenidos

1. [Â¿QuÃ© hace el sistema?](#1-quÃ©-hace-el-sistema)
2. [Base de datos â€” estructura y seed](#2-base-de-datos--estructura-y-seed)
3. [Sistema de seguridad en capas](#3-sistema-de-seguridad-en-capas)
4. [Usuarios, roles y permisos](#4-usuarios-roles-y-permisos)
5. [Contribuyentes y asignaciones](#5-contribuyentes-y-asignaciones)
6. [Pipeline OCR â€” compra y venta](#6-pipeline-ocr--compra-y-venta)
7. [Bolsa de revisiÃ³n](#7-bolsa-de-revisiÃ³n)
8. [ExportaciÃ³n RG90 (Marangatu)](#8-exportaciÃ³n-rg90-marangatu)
9. [Suscripciones y Free Trial](#9-suscripciones-y-free-trial)
10. [ImplementaciÃ³n frontend web](#10-implementaciÃ³n-frontend-web)
11. [ImplementaciÃ³n app mÃ³vil](#11-implementaciÃ³n-app-mÃ³vil)
12. [CÃ³mo testear la API](#12-cÃ³mo-testear-la-api)

---

## Correcciones P0.7
| Sección | Corrección   |
|---|---|


## 1. Â¿QuÃ© hace el sistema?

El sistema es una **API REST SaaS para contadores y contribuyentes de Paraguay** que necesitan cumplir con las obligaciones tributarias ante la SET (SubsecretarÃ­a de Estado de TributaciÃ³n) vÃ­a el portal Marangatu.

### Problema que resuelve

Cada mes, los contribuyentes deben declarar sus comprobantes de compra (egresos) y venta (ingresos) en el sistema RG90 de Marangatu. El proceso manual implica tipear cientos de facturas. Este sistema:

1. **Toma una foto** de la factura o ticket
2. **Extrae los datos fiscales** mediante OCR (Tesseract + Google Vision como fallback)
3. **Valida la cuadratura matemÃ¡tica** (gravada 10% + gravada 5% + exenta = total)
4. **Clasifica el gasto** automÃ¡ticamente (alimentaciÃ³n, salud, educaciÃ³n, etc.)
5. **Guarda el comprobante** listo para exportar
6. **Genera el CSV RG90** en el formato exacto que acepta Marangatu

### Modelo de negocio (SaaS)

- Una empresa de contabilidad (administrador del sistema) gestiona mÃºltiples contribuyentes
- Cada contribuyente tiene una **suscripciÃ³n** activa para poder operar
- Los contadores tienen **asignaciones** a los contribuyentes que atienden
- Los reportes CSV se descargan por contribuyente, mes y aÃ±o

---

## 2. Base de datos â€” estructura y seed

### 2.1 CÃ³mo crear la base desde cero

> ⚠️ **Corregido P0.7** C4/C5: Retirado en P0.7. Baseline 21 tablas. Usar  `npm run bootstrap:admin`.

### 2.2 Tablas y su propÃ³sito

| Tabla | PropÃ³sito |
|---|---|
| `paises` | CatÃ¡logo de paÃ­ses (referencial) |
| `departamentos` | Departamentos de Paraguay |
| `ciudades` | Ciudades por departamento |
| `personas` | Datos personales (nombre, apellido, sexo) |
| `tipos_documento` | CI, RUC, Pasaporte, etc. |
| `persona_documentos` | Documentos de cada persona con fecha de vencimiento |
| `roles` | Roles del sistema (Administrador, Contador, Solo Lectura) |
| `usuarios` | Cuentas de acceso â€” email + password bcrypt + `activo` |
| `grupo_menu` | AgrupaciÃ³n visual de menÃºs en la UI |
| `menu` | Cada pantalla/funciÃ³n del sistema con su URL |
| `menu_rol` | Tabla pivot: quÃ© puede hacer cada rol en cada menÃº |
| `contribuyentes` | RUC + razÃ³n social + persona responsable |
| `asignaciones_contables` | QuÃ© contador atiende a quÃ© contribuyente |
| `comprobantes` | Facturas/tickets de compra (egresos) con datos fiscales |
| `comprobantes_ventas` | Facturas emitidas (ingresos) con datos fiscales |
| `ocr_entrenamientos` | CÃ¡psula de entrenamiento IA por cada comprobante procesado |
| `set_rucs` | CatÃ¡logo de RUCs cargados desde la SET (razÃ³n social + estado) |
| `suscripciones` | Estado de suscripciÃ³n por contribuyente (ACTIVO/MOROSO/CANCELADO) |
| `cuotas_pagos` | Historial de cuotas con fecha, monto y estado |
| `refresh_tokens` | Tokens de sesiÃ³n de 30 dÃ­as (rotaciÃ³n en cada uso) |
| `password_reset_tokens` | Tokens de recuperaciÃ³n de contraseÃ±a (1 hora, un solo uso) |

### 2.3 Datos que inserta el seed por defecto

#### Grupos de menÃº (5)
```
id=1  â†’ Negocio Tributario
id=2  â†’ GestiÃ³n de Personas
id=3  â†’ Cobranzas
id=4  â†’ ConfiguraciÃ³n del Sistema
id=5  â†’ Reportes
```

#### MenÃºs (17) â€” con sus URLs exactas
```
id=1  â†’ /negocio/comprobantes        (Comprobantes de Compra)
id=2  â†’ /negocio/contribuyentes      (Contribuyentes)
id=3  â†’ /negocio/exportaciones       (Exportaciones RG90)
id=4  â†’ /ocr-tax                     (OCR ExtracciÃ³n)
id=5  â†’ /negocio/asignaciones-contables
id=6  â†’ /usuarios
id=7  â†’ /roles
id=8  â†’ /menu
id=9  â†’ /grupo-menu
id=10 â†’ /menu-rol
id=11 â†’ /cobranzas/suscripciones
id=12 â†’ /cobranzas/cuotas-pagos
id=13 â†’ /personas
id=14 â†’ /persona-documentos
id=15 â†’ /tipos-documento
id=16 â†’ /pais
id=17 â†’ /negocio/comprobantes-ventas (Comprobantes de Venta)
```

#### Roles (3)
| ID | Nombre | Acceso |
|---|---|---|
| 1 | Administrador | Listar + Guardar + Editar + Eliminar en todos los menÃºs |
| 2 | Contador | Listar + Guardar + Editar en operativos. Sin acceso a configuraciÃ³n de sistema |
| 3 | Solo Lectura | Solo listar en todos los mÃ³dulos |

#### Permisos menu_rol (41 registros)

El seed inserta los 37 registros de permisos distribuidos asÃ­: 
> ⚠️ **Corregido P0.7** C5: 37 menu_rol.

- **Administrador (rol_id=1):** LGED (Listar+Guardar+Editar+Eliminar) en los 17 menÃºs
- **Contador (rol_id=2):** LGEO en comprobantes, ventas, OCR, exportaciones, asignaciones. Sin acceso a configuraciÃ³n del sistema (roles, menÃº, grupo-menu, menu-rol, tipos-documento, pais, usuarios)
- **Solo Lectura (rol_id=3):** Solo L (listar) en todos los mÃ³dulos

#### Usuario administrador inicial

> ⚠️ **Corregido P0.7** C6/C7/C8/C11: Usar  `npm run bootstrap:admin`.

---

## 3. Sistema de seguridad en capas

### 3.1 Diagrama del flujo completo

```
Solicitud HTTP
      â”‚
      â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ThrottlerGuard (global)        â”‚ â†’ 429 si supera 100 req/min por IP
â”‚  Login: 5 req/min               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â”‚
      â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  JwtAuthGuard + JwtStrategy     â”‚ â†’ 401 si token invÃ¡lido o expirado
â”‚  Verifica firma + activo en BD  â”‚   401 si usuario.activo = false
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â”‚
      â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  MenuRolGuard                   â”‚ â†’ 403 si el rol no tiene permiso
â”‚  Consulta menu_rol por          â”‚   para el mÃ©todo HTTP en esa ruta
â”‚  rol_id + menu.url              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â”‚
      â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  SuscripcionGuard (opcional)    â”‚ â†’ 403 si suscripciÃ³n CANCELADA
â”‚  Solo en POST comprobantes      â”‚   sin trial vigente
â”‚  y GET exportaciones            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â”‚
      â–¼
  Handler del controller
```

### 3.2 JwtAuthGuard â€” quÃ© verifica

Cuando llega un request con `Authorization: Bearer <token>`:

1. Verifica la firma del JWT con `JWT_SECRET`
2. Verifica que no haya expirado (8 horas)
3. **Consulta en BD** que `usuario.activo = true` â€” si un admin desactiva un usuario, sus tokens en curso dejan de funcionar de inmediato

El payload del JWT contiene:
```json
{
  "sub": 1,
  "email": "usuario@ejemplo.com",
  "rol": { "id": 2, "nombre": "Contador" },
  "nombre": "Juan",
  "apellido": "GarcÃ­a",
  "iat": 1748900000,
  "exp": 1748928800
}
```

### 3.3 MenuRolGuard â€” lÃ³gica de permisos

Este es el nÃºcleo del control de acceso. Para cada solicitud:

```
HTTP Method â†’ Flag en menu_rol
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
GET    â†’ permitir_listar
POST   â†’ permitir_guardar
PATCH  â†’ permitir_editar
PUT    â†’ permitir_editar
DELETE â†’ permitir_eliminar
```

El guard lee el decorador `@RequierePermiso('/negocio/comprobantes')` del controller y ejecuta:

```sql
SELECT mr.*
FROM menu_rol mr
JOIN menu m ON m.id = mr.menu_id
WHERE mr.rol_id = :rolId
  AND m.url = '/negocio/comprobantes'
LIMIT 1
```

Si el registro no existe o el flag estÃ¡ en `false` â†’ **403 Forbidden**.

**Default deny:** si un controller no tiene `@RequierePermiso`, el acceso se bloquea automÃ¡ticamente.

### 3.4 SuscripcionGuard â€” control SaaS

Se aplica en:
- `POST /negocio/comprobantes` (carga manual de compras)
- `POST /negocio/comprobantes-ventas` (carga manual de ventas)
- `GET /negocio/exportaciones/rg90/compras`
- `GET /negocio/exportaciones/rg90/ventas`

Lee `contribuyente_id` del body o del query string y consulta:

```sql
SELECT estado FROM suscripciones
WHERE contribuyente_id = ?
  AND estado = 'CANCELADO'
  AND (es_trial = FALSE OR trial_hasta < CURDATE())
LIMIT 1
```

Si existe un registro â†’ **403**. Si el contribuyente estÃ¡ en free trial vigente, el acceso continÃºa.

### 3.5 Capas adicionales en OCR

Los endpoints `POST /ocr-tax/extraer/compra` y `/venta` tienen dos verificaciones extra dentro del handler:

**Capa 2 â€” AsignaciÃ³n contable:**
```
Â¿Tiene el usuario logueado una asignaciÃ³n al contribuyente del RUC enviado?
No â†’ 403 "No tenÃ©s asignaciÃ³n contable para operar este RUC"
```

**Capa 3 â€” SuscripciÃ³n del contribuyente:**
```
Â¿EstÃ¡ la suscripciÃ³n CANCELADA sin trial vigente?
SÃ­ â†’ 403 "La suscripciÃ³n del contribuyente estÃ¡ CANCELADA"
```

---

## 4. Usuarios, roles y permisos

### 4.1 Crear un usuario nuevo

Hay tres formas de crear un usuario en el sistema:

**OpciÃ³n C â€” Login con Google (OAuth2):**
```
GET https://api-qa.acbldeveloper.com/auth/google
â†’ El usuario elige su cuenta Google
â†’ Si no existe en el sistema: se crea automÃ¡ticamente con rol Contador
â†’ El frontend recibe: /auth/google/callback?access_token=...&refresh_token=...
```
> ⚠️ **Corregido P0.7** OAuth no auto-crea usuarios; el cÃ³digo actual todavÃ­a auto-crea (findOrCreateGoogleUser) â†’ pendiente P1a.8a.
> ⚠️ **Corregido P0.7** comportamiento actual inseguro, pendiente P1a.8b.
No requiere token de admin. El usuario queda creado con:
- Nombre y apellido tomados del perfil Google
- Sin documento de identidad (no aplica para OAuth)
- Rol: Contador (id=2) por defecto
- Password: aleatorio (nunca se usa para login por contraseÃ±a)

---

Solo un usuario con permiso `guardar` en `/usuarios` puede crear usuarios por las opciones A y B:

**OpciÃ³n A â€” Creando persona en el mismo request:**
```http
POST /auth/register
Authorization: Bearer <token_admin>

{
  "email": "contador@empresa.com",
  "password": "<contraseÃ±a-segura>",
  "rol_id": 2,
  "persona": {
    "nombre": "MarÃ­a",
    "apellido": "GonzÃ¡lez",
    "sexo": "F",
    "documentos": [
      {
        "tipo_documento_id": 1,
        "numero": "4567890",
        "fecha_vencimiento": null
      }
    ]
  }
}
```

**OpciÃ³n B â€” Usando persona existente:**
```http
POST /auth/register
Authorization: Bearer <token_admin>

{
  "email": "contador@empresa.com",
  "password": "<contraseÃ±a-segura>",
  "rol_id": 2,
  "persona_id": 5
}
```

Al crear un usuario con `es_temporal: false` (por defecto), se envÃ­a automÃ¡ticamente un email de bienvenida con las credenciales.

### 4.2 Configurar permisos de un rol

Los permisos se gestionan en `menu_rol`. Cada registro define quÃ© puede hacer un rol en un menÃº:

```http
POST /menu-rol
Authorization: Bearer <token_admin>

{
  "menu_id": 1,
  "rol_id": 2,
  "permitir_listar": true,
  "permitir_guardar": true,
  "permitir_editar": true,
  "permitir_eliminar": false
}
```

Para ver todos los permisos de un rol:
```http
GET /roles/2/menus
Authorization: Bearer <token_admin>
```

### 4.3 Ciclo de sesiÃ³n completo

```
1. Login
POST /auth/login
â†’ { access_token (8h), refresh_token (30d) }

2. Usar la API
Authorization: Bearer <access_token>

3. Renovar sesiÃ³n (antes de que expire el access_token)
POST /auth/refresh
Body: { "refresh_token": "..." }
â†’ { access_token (nuevo 8h), refresh_token (nuevo 30d) }
   El refresh_token anterior queda revocado automÃ¡ticamente.

4. Cerrar sesiÃ³n
POST /auth/logout
Authorization: Bearer <access_token>
Body: { "refresh_token": "..." }
â†’ El refresh_token queda revocado en BD.
```

**RotaciÃ³n de refresh token:** cada `/auth/refresh` invalida el anterior. Si un token robado ya fue rotado, el intento de usarlo falla con 401.

---

## 5. Contribuyentes y asignaciones

### 5.1 Â¿QuÃ© es un contribuyente?

Un contribuyente es la empresa o persona fÃ­sica con RUC que debe declarar ante la SET. En el sistema, cada contribuyente:
- Tiene un **RUC Ãºnico** (sin dÃ­gito verificador, solo los dÃ­gitos)
- EstÃ¡ vinculado a una **persona** (persona_id) que es el responsable legal
- Puede tener una o mÃ¡s **suscripciones**
- Tiene **comprobantes** de compra y venta asociados

### 5.2 Crear un contribuyente

```http
POST /negocio/contribuyentes
Authorization: Bearer <token>

{
  "ruc": "80123456",
  "razon_social": "Mi Empresa SA",
  "nombre_fantasia": "MiEmpresa",
  "persona_id": 3
}
```

El RUC se valida como Ãºnico â€” si ya existe, retorna `409 Conflict`.

### 5.3 Asignaciones contables

Para que un contador pueda procesar comprobantes de un contribuyente vÃ­a OCR, debe tener una asignaciÃ³n:

```http
POST /negocio/asignaciones-contables
Authorization: Bearer <token>

{
  "usuario_id": 4,
  "contribuyente_id": 2
}
```

**Sin asignaciÃ³n â†’ 403 en OCR.** El sistema verifica esta relaciÃ³n en cada llamada al OCR.

Filtrar asignaciones de un usuario:
```http
GET /negocio/asignaciones-contables?usuario_id=4
GET /negocio/asignaciones-contables?contribuyente_id=2
```

---

## 6. Pipeline OCR â€” compra y venta

### 6.1 Flujo completo de procesamiento

```
1. Frontend toma la foto (cÃ¡mara o galerÃ­a)
2. POST /ocr-tax/extraer/compra  (o /venta)
   multipart/form-data:
     imagen: [archivo JPG/PNG/WebP, max 5MB]
     ruc:    "80123456"  (RUC del contribuyente, sin DV)
         â”‚
         â–¼
3. Validaciones de seguridad (3 capas)
         â”‚
         â–¼
4. sharp â†’ convierte a WebP optimizado
         â”‚
         â–¼
5. Sube imagen a Cloudflare R2
         â”‚
         â–¼
6. Tesseract.js â†’ extrae texto del WebP
   Â¿Confianza < 75% o faltan campos clave?
   SÃ â†’ Google Vision como fallback
         â”‚
         â–¼
7. RegexParserService â†’ extrae campos fiscales:
   - RUC del emisor/cliente
   - NÃºmero de comprobante (###-###-#######)
   - Timbrado (8 dÃ­gitos)
   - Fecha de emisiÃ³n
   - Monto total, gravada 10%, gravada 5%, exenta
         â”‚
         â–¼
8. InvoiceParaguayValidatorService â†’ valida:
   - Â¿gravada_10 + gravada_5 + exenta â‰ˆ total?
   - Â¿Timbrado dentro de vigencia?
   - Â¿Campos mÃ­nimos presentes?
         â”‚
         â–¼
9. Busca el RUC en set_rucs â†’ obtiene razÃ³n social y estado SET
   Si estado SET â‰  ACTIVO â†’ marca REQUIERE_REVISION
         â”‚
         â–¼
10. ClasificadorGastoHelper â†’ clasifica tipo IRP:
    ALIMENTACION, SALUD, EDUCACION, VIVIENDA, etc.
    (solo para compras)
         â”‚
         â–¼
11. Guarda en comprobantes / comprobantes_ventas
12. Guarda cÃ¡psula en ocr_entrenamientos
         â”‚
         â–¼
13. Respuesta:
    {
      "comprobante_id": 42,
      "estado_ocr": "AUTO_PROCESADO",
      "datos_identificados": { ... }
    }
```

### 6.2 Estados de un comprobante

| Estado | Significado | AcciÃ³n requerida |
|---|---|---|
| `EN_COLA` | Creado manualmente, sin procesar | Ninguna |
| `PROCESANDO` | Un contador lo reclamÃ³ de la bolsa | El contador estÃ¡ revisando |
| `AUTO_PROCESADO` | OCR exitoso, cuadratura correcta | Ninguna â€” listo para RG90 |
| `REQUIERE_REVISION` | OCR dudoso, cuadratura incorrecta o RUC inactivo SET | Contador debe revisar y corregir |
| `VERIFICADO_HUMANO` | Contador revisÃ³ y confirmÃ³ | Listo para RG90 |
| `ERROR_PROCESAMIENTO` | Falla tÃ©cnica grave en OCR | Reportar al administrador |

### 6.3 Diferencias entre compra y venta

| Campo | Compra (egreso) | Venta (ingreso) |
|---|---|---|
| IdentificaciÃ³n del otro | `ruc_emisor` + `razon_social_emisor` | `ruc_cliente` + `razon_social_cliente` |
| Tipo de gasto IRP | `tipo_gasto` (ALIMENTACION, SALUD, etc.) | No aplica |
| `no_imputa` | SÃ­ | No |
| `comprobante_asociado` | SÃ­ (para notas dÃ©bito/crÃ©dito) | No |
| CreaciÃ³n via OCR | `POST /ocr-tax/extraer/compra` | `POST /ocr-tax/extraer/venta` |
| CreaciÃ³n manual | `POST /negocio/comprobantes` | `POST /negocio/comprobantes-ventas` |

### 6.4 Carga manual (sin OCR)

Cuando se tiene el comprobante en formato digital o se quiere corregir uno existente:

```http
POST /negocio/comprobantes
Authorization: Bearer <token>

{
  "contribuyente_id": 1,
  "nro_comprobante": "001-001-0000123",
  "timbrado": "12345678",
  "ruc_emisor": "80123456-7",
  "razon_social_emisor": "Supermercado SA",
  "fecha_emision": "2026-06-01",
  "monto_total": 150000,
  "gravada_10": 136364,
  "iva_10": 13636,
  "gravada_5": 0,
  "iva_5": 0,
  "exenta": 0,
  "tipo_comprobante_set": 101,
  "condicion_operacion": 1,
  "imputa_iva": "S",
  "imputa_ire": "N",
  "imputa_irp": "S",
  "no_imputa": "N",
  "moneda_extranjera": "N"
}
```

---

## 7. Bolsa de revisiÃ³n

### 7.1 Â¿QuÃ© es la bolsa?

La bolsa es una cola de comprobantes que el OCR marcÃ³ como `REQUIERE_REVISION`. Funciona como un sistema de tickets: un contador "reclama" un comprobante para revisarlo, lo corrige y lo marca como verificado.

Evita que dos contadores trabajen el mismo comprobante al mismo tiempo (mutex por `revisor_id`).

### 7.2 Flujo de la bolsa

```
OCR detecta problema
      â”‚
      â–¼
Comprobante queda en estado REQUIERE_REVISION
revisor_id = NULL
      â”‚
      â–¼
GET /negocio/comprobantes/bolsa/pendientes
â†’ Lista de comprobantes sin revisor
?page=1&limit=20
      â”‚
      â–¼
Contador selecciona uno y lo reclama:
POST /negocio/comprobantes/bolsa/42/reclamar
â†’ { revisor_id: 4, estado_ocr: "PROCESANDO" }
      â”‚
      â–¼
Contador revisa la imagen en Cloudflare R2
(url_foto_webp del comprobante)
      â”‚
      â–¼
Contador corrige los datos:
PATCH /negocio/comprobantes/42
{
  "ruc_emisor": "80123456",
  "monto_total": 150000,
  "gravada_10": 136364,
  "iva_10": 13636,
  "estado_ocr": "VERIFICADO_HUMANO"
}
      â”‚
      â–¼
Al pasar a VERIFICADO_HUMANO:
- Se actualiza ocr_entrenamientos con json_humano
- Se marca como LISTO_PARA_ENTRENAR (para futuro modelo IA)
- El comprobante queda listo para el CSV RG90
```

### 7.3 Filtrar comprobantes por estado

```http
GET /negocio/comprobantes?estado_ocr=REQUIERE_REVISION&contribuyente_id=1
GET /negocio/comprobantes?estado_ocr=AUTO_PROCESADO
GET /negocio/comprobantes-ventas?estado_ocr=VERIFICADO_HUMANO
```

---

## 8. ExportaciÃ³n RG90 (Marangatu)

### 8.1 Â¿QuÃ© es el RG90?

La ResoluciÃ³n General 90 define el formato del archivo CSV que se carga en Marangatu para declarar compras y ventas. El sistema genera este archivo automÃ¡ticamente.

### 8.2 Estructura del CSV

Cada lÃ­nea representa un comprobante con 17 campos en orden exacto. Ejemplos:

**Compra (tipo registro = 2):**
```
2|001-001-0000123|12345678|01/06/2026|80123456|Supermercado SA|101|1|150000|136364|13636|0|0|0|S|N|S
```

**Venta (tipo registro = 1):**
```
1|001-002-0000456|87654321|15/06/2026|12345678|Cliente SA|101|1|200000|181818|18182|0|0|0|S|N|N
```

Reglas de formato:
- RUC sin dÃ­gito verificador
- Montos como enteros (sin decimales ni separadores)
- Fechas en `dd/mm/aaaa`
- Campos S/N para imputaciones

### 8.3 Generar el CSV

```http
# Por mes especÃ­fico (junio 2026)
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026&mes=6
GET /negocio/exportaciones/rg90/ventas?contribuyente_id=1&anio=2026&mes=6

# AÃ±o completo
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026
GET /negocio/exportaciones/rg90/ventas?contribuyente_id=1&anio=2026
```

El response tiene `Content-Disposition: attachment; filename="RG90_COMPRAS_2026_6.csv"` â€” el browser/app lo descarga directamente.

> Solo incluye comprobantes con `deleted_at = NULL`. Los eliminados (soft delete) no aparecen en el CSV.

---

## 9. Suscripciones y Free Trial

### 9.1 Estados de suscripciÃ³n

| Estado | Puede operar |
|---|---|
| `ACTIVO` | SÃ­ |
| `MOROSO` | SÃ­ (solo advertencia, sin bloqueo automÃ¡tico) |
| `CANCELADO` | No â€” 403 en POST comprobantes y GET exportaciones |
| `CANCELADO` + trial vigente | SÃ­ hasta `trial_hasta` |

### 9.2 Crear suscripciÃ³n normal

```http
POST /cobranzas/suscripciones
Authorization: Bearer <token>

{
  "contribuyente_id": 1,
  "estado": "ACTIVO",
  "fecha_inicio": "2026-06-01"
}
```

### 9.3 Crear con free trial

```http
POST /cobranzas/suscripciones
Authorization: Bearer <token>

{
  "contribuyente_id": 2,
  "estado": "CANCELADO",
  "fecha_inicio": "2026-06-01",
  "es_trial": true,
  "trial_hasta": "2026-07-31"
}
```

El contribuyente opera libremente hasta el 31/07/2026, luego queda bloqueado automÃ¡ticamente.

### 9.4 Registrar un pago

```http
POST /cobranzas/cuotas-pagos
Authorization: Bearer <token>

{
  "suscripcion_id": 1,
  "monto": 150000,
  "fecha_vencimiento": "2026-07-01",
  "fecha_pago": "2026-06-28",
  "estado": "PAGADO"
}
```

---

## 10. ImplementaciÃ³n frontend web

### 10.1 Flujo de autenticaciÃ³n

**OpciÃ³n A â€” Login con email/password:**
```javascript
// 1. Login
const res = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { access_token, refresh_token, user } = await res.json();

// Guardar tokens
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);

// 2. Interceptor Axios â€” agrega el token automÃ¡ticamente
axios.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
  return config;
});

// 3. Interceptor de respuesta â€” renueva el token si expirÃ³
axios.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      const { data } = await axios.post('/auth/refresh', {
        refresh_token: localStorage.getItem('refresh_token')
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      // Reintentar el request original
      error.config.headers.Authorization = `Bearer ${data.access_token}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

**OpciÃ³n B â€” Login con Google OAuth2:**
```javascript
// El frontend simplemente redirige al endpoint de Google
window.location.href = 'https://api-qa.acbldeveloper.com/auth/google';

// Google autentica â†’ la API redirige de vuelta al frontend:
// https://mifrontend.com/auth/google/callback?access_token=eyJ...&refresh_token=abc123

// En la pÃ¡gina /auth/google/callback del frontend:
const params = new URLSearchParams(window.location.search);
const access_token = params.get('access_token');
const refresh_token = params.get('refresh_token');

// Guardar igual que en el login normal
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);

// Redirigir al home
window.location.href = '/dashboard';
```

> Con popup (sin perder la pÃ¡gina actual):
> ```javascript
> const popup = window.open('/auth/google', 'google-login', 'width=500,height=600');
> window.addEventListener('message', (event) => {
>   if (event.data.access_token) {
>     localStorage.setItem('access_token', event.data.access_token);
>     popup.close();
>   }
> });
> ```

---

### 10.2 MenÃº dinÃ¡mico basado en permisos

Al hacer login, obtener los permisos del rol del usuario:

```javascript
// DespuÃ©s del login, cargar los permisos del rol
const { data: menus } = await axios.get(`/roles/${user.rol.id}/menus`);

// menus = [
//   { menu: { url: '/negocio/comprobantes', nombre: 'Comprobantes' },
//     permitir_listar: true, permitir_guardar: true, ... },
//   ...
// ]

// Renderizar el menÃº solo con los items que el rol puede listar
const menuVisible = menus.filter(m => m.permitir_listar);
```

**LÃ³gica de botones:**
```javascript
// Solo mostrar botÃ³n "Nuevo" si puede guardar
if (permisos['/negocio/comprobantes']?.permitir_guardar) {
  showButton('nuevo-comprobante');
}

// Solo mostrar botÃ³n "Eliminar" si puede eliminar
if (permisos['/negocio/comprobantes']?.permitir_eliminar) {
  showButton('eliminar-comprobante');
}
```

### 10.3 Pantallas principales

**Dashboard / Home:**
- Resumen de comprobantes del mes (pendientes de revisiÃ³n, procesados, total)
- Acceso rÃ¡pido a bolsa de revisiÃ³n
- Estado de suscripciones de los contribuyentes asignados

**MÃ³dulo de Comprobantes:**
```
GET /negocio/comprobantes?contribuyente_id=1&page=1&limit=20
GET /negocio/comprobantes?contribuyente_id=1&estado_ocr=REQUIERE_REVISION
GET /negocio/comprobantes?contribuyente_id=1&estado_ocr=AUTO_PROCESADO
```

**Bolsa de revisiÃ³n:**
```
GET /negocio/comprobantes/bolsa/pendientes?page=1&limit=20
â†’ Mostrar lista con imagen (url_foto_webp), datos detectados
â†’ BotÃ³n "Reclamar" â†’ POST /negocio/comprobantes/bolsa/:id/reclamar
â†’ Formulario de correcciÃ³n â†’ PATCH /negocio/comprobantes/:id
â†’ BotÃ³n "Verificar" â†’ PATCH con { estado_ocr: "VERIFICADO_HUMANO" }
```

**ExportaciÃ³n:**
```
Seleccionar: contribuyente + aÃ±o + mes (opcional)
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026&mes=6
â†’ Descarga automÃ¡tica del CSV
```

### 10.4 Manejo de errores HTTP

| CÃ³digo | Causa | AcciÃ³n en UI |
|---|---|---|
| 400 | ValidaciÃ³n DTO fallida | Mostrar campos con error del `message` |
| 401 | Token expirado | Intentar refresh, si falla â†’ logout |
| 403 | Sin permiso | Mostrar "Sin acceso a esta funciÃ³n" |
| 403 | SuscripciÃ³n CANCELADA | Mostrar aviso de suscripciÃ³n vencida |
| 404 | Recurso no encontrado | Mostrar "No encontrado" |
| 409 | Duplicado (RUC, comprobante) | Mostrar "Ya existe" |
| 429 | Rate limit | Mostrar "Demasiados intentos, espere" |

---

## 11. ImplementaciÃ³n app mÃ³vil

### 11.1 Diferencias clave con la web

| Aspecto | Web | App MÃ³vil |
|---|---|---|
| Tokens | `localStorage` | `SecureStorage` / Keychain |
| OCR | Subida de imagen existente | CÃ¡mara en tiempo real |
| Refresh | Interceptor Axios | Interceptor HTTP del framework |
| MenÃº | Sidebar completo | Bottom navigation simplificado |
| Offline | No aplica | Cache de comprobantes pendientes |

### 11.2 Flujo de captura con cÃ¡mara (caso principal)

```
1. Usuario abre la app â†’ pantalla principal del contribuyente

2. Toca botÃ³n "Escanear Factura"

3. App abre cÃ¡mara nativa

4. Usuario enfoca la factura y dispara

5. App comprime la imagen (max 1MB recomendado, API acepta hasta 5MB)

6. App construye el FormData:
   const formData = new FormData();
   formData.append('imagen', {
     uri: photoUri,
     type: 'image/jpeg',
     name: 'factura.jpg'
   });
   formData.append('ruc', contribuyente.ruc);  // RUC sin DV

7. POST /ocr-tax/extraer/compra
   Headers: Authorization: Bearer <token>
   Body: formData (multipart/form-data)

8. SegÃºn estado_ocr de la respuesta:
   AUTO_PROCESADO    â†’ "âœ“ Factura registrada correctamente"
   REQUIERE_REVISION â†’ "âš  Necesita revisiÃ³n manual"
   Error 400         â†’ Mostrar mensaje especÃ­fico

9. Mostrar pantalla de confirmaciÃ³n con datos detectados
   permitiendo correcciÃ³n antes de confirmar
```

### 11.3 Almacenamiento seguro de tokens

```javascript
// React Native con expo-secure-store
import * as SecureStore from 'expo-secure-store';

// Guardar al login
await SecureStore.setItemAsync('access_token', access_token);
await SecureStore.setItemAsync('refresh_token', refresh_token);

// Leer para requests
const token = await SecureStore.getItemAsync('access_token');

// Al logout
await SecureStore.deleteItemAsync('access_token');
await SecureStore.deleteItemAsync('refresh_token');
```

### 11.4 Flujo offline bÃ¡sico

Para cuando el usuario no tiene conexiÃ³n:

```
1. Toma la foto y guarda localmente con el RUC
2. App muestra "Guardado localmente â€” se enviarÃ¡ cuando haya conexiÃ³n"
3. Al recuperar conexiÃ³n, la app intenta subir los pendientes
4. POST /ocr-tax/extraer/compra para cada pendiente local
```

### 11.5 Pantallas recomendadas para la app

```
Login
  â””â”€â”€ Home (resumen del contribuyente activo)
       â”œâ”€â”€ Escanear Compra
       â”œâ”€â”€ Escanear Venta
       â”œâ”€â”€ Mis Comprobantes (lista paginada con filtros)
       â”œâ”€â”€ Bolsa de RevisiÃ³n (solo roles con permisos)
       â””â”€â”€ Exportar RG90 (descarga o comparte el CSV)
```

---

## 12. CÃ³mo testear la API

### 12.1 Usando la colecciÃ³n Postman

El archivo `collection/Facturacion-IVA.postman_collection.json` contiene 100+ requests listos. Para importar:

1. Abrir Postman â†’ Import â†’ subir el archivo
2. Configurar variables de colecciÃ³n:
   - `baseUrl`: `http://localhost:9031`
   - `token`: (se llena con el access_token del login)
   - `apiKey`: (para endpoints de departamento/ciudad)

### 12.2 Credenciales de prueba (seed)

```
email:    <contraseÃ±a-segura>
password: <contraseÃ±a-segura>
rol:      Administrador (acceso total)
```

### 12.3 Flujo de prueba completo paso a paso

```
PASO 1 â€” Obtener token
POST /auth/login
{ "email": "<contraseÃ±a-segura>", "password": "<contraseÃ±a-segura>" }
â†’ Copiar access_token a la variable {{token}}

PASO 2 â€” Crear una persona
POST /personas
{ "nombre": "Juan", "apellido": "GarcÃ­a", "sexo": "M" }
â†’ Anotar el id

PASO 3 â€” Crear un contribuyente
POST /negocio/contribuyentes
{ "ruc": "80123456", "razon_social": "Juan SA", "persona_id": <id del paso 2> }
â†’ Anotar el id (ej: contribuyente_id = 1)

PASO 4 â€” Crear suscripciÃ³n
POST /cobranzas/suscripciones
{ "contribuyente_id": 1, "estado": "ACTIVO", "fecha_inicio": "2026-01-01" }

PASO 5 â€” Crear usuario contador
POST /auth/register
{ "email": "contador@empresa.com", "password": "<contraseÃ±a-segura>", "rol_id": 2,
  "persona": { "nombre": "Ana", "apellido": "LÃ³pez", "sexo": "F",
    "documentos": [{ "tipo_documento_id": 1, "numero": "1234567" }] } }
â†’ Anotar el id del usuario

PASO 6 â€” Asignar el contador al contribuyente
POST /negocio/asignaciones-contables
{ "usuario_id": <id contador>, "contribuyente_id": 1 }

PASO 7 â€” Login como contador
POST /auth/login
{ "email": "contador@empresa.com", "password": "<contraseÃ±a-segura>" }
â†’ Copiar nuevo access_token a {{token}}

PASO 8 â€” Cargar comprobante manual
POST /negocio/comprobantes
{
  "contribuyente_id": 1,
  "nro_comprobante": "001-001-0000001",
  "timbrado": "12345678",
  "ruc_emisor": "80111222",
  "razon_social_emisor": "Proveedor SA",
  "fecha_emision": "2026-06-01",
  "monto_total": 110000,
  "gravada_10": 100000,
  "iva_10": 10000,
  "gravada_5": 0,
  "iva_5": 0,
  "exenta": 0,
  "tipo_comprobante_set": 101,
  "condicion_operacion": 1,
  "imputa_iva": "S",
  "imputa_ire": "N",
  "imputa_irp": "S",
  "no_imputa": "N",
  "moneda_extranjera": "N"
}

PASO 9 â€” Exportar CSV RG90
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026&mes=6
â†’ Descarga RG90_COMPRAS_2026_6.csv
```

### 12.4 Testear el OCR

```
POST /ocr-tax/extraer/compra
Header: Authorization: Bearer <token_contador>
Body (form-data):
  imagen: [adjuntar imagen JPG de una factura]
  ruc: 80123456

Respuesta esperada:
{
  "mensaje": "Gasto procesado correctamente",
  "comprobante_id": 10,
  "estado_ocr": "AUTO_PROCESADO" | "REQUIERE_REVISION",
  "datos_identificados": {
    "ruc": "80111222",
    "nroComprobante": "001-001-0000123",
    "timbrado": "12345678",
    "total": "150000",
    ...
  }
}
```

### 12.5 Testear la bolsa de revisiÃ³n

```
1. Crear un comprobante con estado_ocr: "REQUIERE_REVISION"
   PATCH /negocio/comprobantes/10
   { "estado_ocr": "REQUIERE_REVISION", "revisor_id": null }

2. Ver la bolsa
   GET /negocio/comprobantes/bolsa/pendientes

3. Reclamar (como contador)
   POST /negocio/comprobantes/bolsa/10/reclamar

4. Corregir y verificar
   PATCH /negocio/comprobantes/10
   { "ruc_emisor": "80111222", "estado_ocr": "VERIFICADO_HUMANO" }

5. Verificar que ocr_entrenamientos se actualizÃ³
   (no hay endpoint directo â€” verificar en BD)
```

### 12.6 Testear el guard de suscripciÃ³n

```
1. Crear suscripciÃ³n CANCELADA sin trial
   POST /cobranzas/suscripciones
   { "contribuyente_id": 1, "estado": "CANCELADO", "fecha_inicio": "2026-01-01" }

2. Intentar cargar comprobante â†’ debe retornar 403
   POST /negocio/comprobantes
   { "contribuyente_id": 1, ... }

3. Activar free trial
   PATCH /cobranzas/suscripciones/1
   { "es_trial": true, "trial_hasta": "2026-12-31" }

4. Reintentar el POST â†’ ahora debe funcionar
```

### 12.7 Verificar el lÃ­mite de rate en login

```bash
# Enviar 6 requests en menos de 1 minuto
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:9031/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password": "<contraseÃ±a-segura>"}'
done
# Los primeros 5 â†’ 401, el 6to â†’ 429
```

---

## ApÃ©ndice â€” Chequeo de estado final (2026-06-05)

### API completa âœ…

| MÃ³dulo | Endpoints | Estado |
|---|---|---|
| Auth | login, me, refresh, logout, register, forgot/reset/cambiar-password | âœ… |
| Auth Google OAuth | GET /auth/google + GET /auth/google/callback | âœ… (pendiente credenciales Google Cloud) |
| Personas | CRUD + paginaciÃ³n | âœ… |
| Usuarios | CRUD + paginaciÃ³n + email bienvenida | âœ… |
| Persona Documentos | CRUD | âœ… |
| Contribuyentes | CRUD + paginaciÃ³n + soft delete | âœ… |
| Comprobantes Compra | CRUD + paginaciÃ³n + filtro estado + bolsa paginada + soft delete | âœ… |
| Comprobantes Venta | CRUD + paginaciÃ³n + filtro estado + bolsa paginada + soft delete | âœ… |
| OCR Compra | Pipeline completo 3 capas de seguridad | âœ… |
| OCR Venta | Pipeline completo (paridad con compra) | âœ… |
| Exportaciones RG90 | Compras y ventas por mes/aÃ±o + SuscripcionGuard | âœ… |
| Asignaciones Contables | CRUD + paginaciÃ³n + filtros | âœ… |
| Suscripciones | CRUD + paginaciÃ³n + filtro contribuyente | âœ… |
| Cuotas de Pago | CRUD + paginaciÃ³n + filtro suscripcion | âœ… |
| Roles | CRUD + GET menus del rol | âœ… |
| MenÃº / Grupo MenÃº / Menu-Rol | CRUD configuraciÃ³n sistema | âœ… |
| Tipos de Documento | CRUD | âœ… |
| PaÃ­s | CRUD + carga masiva (JWT) | âœ… |
| Departamento / Ciudad | CRUD + carga masiva (ApiKeyGuard) | âœ… |

### Gaps funcionales conocidos (fuera del alcance actual)

| Gap | Impacto |
|---|---|
| MÃ³dulo de planes/tiers | SaaS con lÃ­mites de uso por plan |
| email_contacto en personas | Mejora menor |
| comprobante_asociado en ventas | Notas dÃ©bito/crÃ©dito de ventas |
| AuditorÃ­a de cambios en comprobantes | Trazabilidad de ediciones |
