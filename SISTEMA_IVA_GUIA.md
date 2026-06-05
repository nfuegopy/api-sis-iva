# Sistema de Facturación IVA Paraguay — Guía Técnica Completa

**API Base URL:** `http://localhost:9031`  
**Stack:** NestJS 11 · TypeORM 0.3 · MySQL 8.0 · JWT · Tesseract.js · Google Vision · Cloudflare R2  
**Fecha:** 2026-06-05

---

## Tabla de contenidos

1. [¿Qué hace el sistema?](#1-qué-hace-el-sistema)
2. [Base de datos — estructura y seed](#2-base-de-datos--estructura-y-seed)
3. [Sistema de seguridad en capas](#3-sistema-de-seguridad-en-capas)
4. [Usuarios, roles y permisos](#4-usuarios-roles-y-permisos)
5. [Contribuyentes y asignaciones](#5-contribuyentes-y-asignaciones)
6. [Pipeline OCR — compra y venta](#6-pipeline-ocr--compra-y-venta)
7. [Bolsa de revisión](#7-bolsa-de-revisión)
8. [Exportación RG90 (Marangatu)](#8-exportación-rg90-marangatu)
9. [Suscripciones y Free Trial](#9-suscripciones-y-free-trial)
10. [Implementación frontend web](#10-implementación-frontend-web)
11. [Implementación app móvil](#11-implementación-app-móvil)
12. [Cómo testear la API](#12-cómo-testear-la-api)

---

## 1. ¿Qué hace el sistema?

El sistema es una **API REST SaaS para contadores y contribuyentes de Paraguay** que necesitan cumplir con las obligaciones tributarias ante la SET (Subsecretaría de Estado de Tributación) vía el portal Marangatu.

### Problema que resuelve

Cada mes, los contribuyentes deben declarar sus comprobantes de compra (egresos) y venta (ingresos) en el sistema RG90 de Marangatu. El proceso manual implica tipear cientos de facturas. Este sistema:

1. **Toma una foto** de la factura o ticket
2. **Extrae los datos fiscales** mediante OCR (Tesseract + Google Vision como fallback)
3. **Valida la cuadratura matemática** (gravada 10% + gravada 5% + exenta = total)
4. **Clasifica el gasto** automáticamente (alimentación, salud, educación, etc.)
5. **Guarda el comprobante** listo para exportar
6. **Genera el CSV RG90** en el formato exacto que acepta Marangatu

### Modelo de negocio (SaaS)

- Una empresa de contabilidad (administrador del sistema) gestiona múltiples contribuyentes
- Cada contribuyente tiene una **suscripción** activa para poder operar
- Los contadores tienen **asignaciones** a los contribuyentes que atienden
- Los reportes CSV se descargan por contribuyente, mes y año

---

## 2. Base de datos — estructura y seed

### 2.1 Cómo crear la base desde cero

```bash
mysql -u root -pTUPASSWORD < schema_bd_sis_iva.sql
```

Este script crea las 22 tablas, aplica el seed completo y deja el sistema listo para usar.

### 2.2 Tablas y su propósito

| Tabla | Propósito |
|---|---|
| `paises` | Catálogo de países (referencial) |
| `departamentos` | Departamentos de Paraguay |
| `ciudades` | Ciudades por departamento |
| `personas` | Datos personales (nombre, apellido, sexo) |
| `tipos_documento` | CI, RUC, Pasaporte, etc. |
| `persona_documentos` | Documentos de cada persona con fecha de vencimiento |
| `roles` | Roles del sistema (Administrador, Contador, Solo Lectura) |
| `usuarios` | Cuentas de acceso — email + password bcrypt + `activo` |
| `grupo_menu` | Agrupación visual de menús en la UI |
| `menu` | Cada pantalla/función del sistema con su URL |
| `menu_rol` | Tabla pivot: qué puede hacer cada rol en cada menú |
| `contribuyentes` | RUC + razón social + persona responsable |
| `asignaciones_contables` | Qué contador atiende a qué contribuyente |
| `comprobantes` | Facturas/tickets de compra (egresos) con datos fiscales |
| `comprobantes_ventas` | Facturas emitidas (ingresos) con datos fiscales |
| `ocr_entrenamientos` | Cápsula de entrenamiento IA por cada comprobante procesado |
| `set_rucs` | Catálogo de RUCs cargados desde la SET (razón social + estado) |
| `suscripciones` | Estado de suscripción por contribuyente (ACTIVO/MOROSO/CANCELADO) |
| `cuotas_pagos` | Historial de cuotas con fecha, monto y estado |
| `refresh_tokens` | Tokens de sesión de 30 días (rotación en cada uso) |
| `password_reset_tokens` | Tokens de recuperación de contraseña (1 hora, un solo uso) |

### 2.3 Datos que inserta el seed por defecto

#### Grupos de menú (5)
```
id=1  → Negocio Tributario
id=2  → Gestión de Personas
id=3  → Cobranzas
id=4  → Configuración del Sistema
id=5  → Reportes
```

#### Menús (17) — con sus URLs exactas
```
id=1  → /negocio/comprobantes        (Comprobantes de Compra)
id=2  → /negocio/contribuyentes      (Contribuyentes)
id=3  → /negocio/exportaciones       (Exportaciones RG90)
id=4  → /ocr-tax                     (OCR Extracción)
id=5  → /negocio/asignaciones-contables
id=6  → /usuarios
id=7  → /roles
id=8  → /menu
id=9  → /grupo-menu
id=10 → /menu-rol
id=11 → /cobranzas/suscripciones
id=12 → /cobranzas/cuotas-pagos
id=13 → /personas
id=14 → /persona-documentos
id=15 → /tipos-documento
id=16 → /pais
id=17 → /negocio/comprobantes-ventas (Comprobantes de Venta)
```

#### Roles (3)
| ID | Nombre | Acceso |
|---|---|---|
| 1 | Administrador | Listar + Guardar + Editar + Eliminar en todos los menús |
| 2 | Contador | Listar + Guardar + Editar en operativos. Sin acceso a configuración de sistema |
| 3 | Solo Lectura | Solo listar en todos los módulos |

#### Permisos menu_rol (41 registros)

El seed inserta los 41 registros de permisos distribuidos así:

- **Administrador (rol_id=1):** LGED (Listar+Guardar+Editar+Eliminar) en los 17 menús
- **Contador (rol_id=2):** LGEO en comprobantes, ventas, OCR, exportaciones, asignaciones. Sin acceso a configuración del sistema (roles, menú, grupo-menu, menu-rol, tipos-documento, pais, usuarios)
- **Solo Lectura (rol_id=3):** Solo L (listar) en todos los módulos

#### Usuario administrador inicial
```
email:    admin@sistema.com
password: 12356  (bcrypt 10 rounds)
rol:      Administrador (id=1)
activo:   true
```

> Cambiar la contraseña en el primer inicio de sesión usando `POST /auth/cambiar-password`.

---

## 3. Sistema de seguridad en capas

### 3.1 Diagrama del flujo completo

```
Solicitud HTTP
      │
      ▼
┌─────────────────────────────────┐
│  ThrottlerGuard (global)        │ → 429 si supera 100 req/min por IP
│  Login: 5 req/min               │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  JwtAuthGuard + JwtStrategy     │ → 401 si token inválido o expirado
│  Verifica firma + activo en BD  │   401 si usuario.activo = false
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  MenuRolGuard                   │ → 403 si el rol no tiene permiso
│  Consulta menu_rol por          │   para el método HTTP en esa ruta
│  rol_id + menu.url              │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│  SuscripcionGuard (opcional)    │ → 403 si suscripción CANCELADA
│  Solo en POST comprobantes      │   sin trial vigente
│  y GET exportaciones            │
└─────────────────────────────────┘
      │
      ▼
  Handler del controller
```

### 3.2 JwtAuthGuard — qué verifica

Cuando llega un request con `Authorization: Bearer <token>`:

1. Verifica la firma del JWT con `JWT_SECRET`
2. Verifica que no haya expirado (8 horas)
3. **Consulta en BD** que `usuario.activo = true` — si un admin desactiva un usuario, sus tokens en curso dejan de funcionar de inmediato

El payload del JWT contiene:
```json
{
  "sub": 1,
  "email": "usuario@ejemplo.com",
  "rol": { "id": 2, "nombre": "Contador" },
  "nombre": "Juan",
  "apellido": "García",
  "iat": 1748900000,
  "exp": 1748928800
}
```

### 3.3 MenuRolGuard — lógica de permisos

Este es el núcleo del control de acceso. Para cada solicitud:

```
HTTP Method → Flag en menu_rol
───────────────────────────────
GET    → permitir_listar
POST   → permitir_guardar
PATCH  → permitir_editar
PUT    → permitir_editar
DELETE → permitir_eliminar
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

Si el registro no existe o el flag está en `false` → **403 Forbidden**.

**Default deny:** si un controller no tiene `@RequierePermiso`, el acceso se bloquea automáticamente.

### 3.4 SuscripcionGuard — control SaaS

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

Si existe un registro → **403**. Si el contribuyente está en free trial vigente, el acceso continúa.

### 3.5 Capas adicionales en OCR

Los endpoints `POST /ocr-tax/extraer/compra` y `/venta` tienen dos verificaciones extra dentro del handler:

**Capa 2 — Asignación contable:**
```
¿Tiene el usuario logueado una asignación al contribuyente del RUC enviado?
No → 403 "No tenés asignación contable para operar este RUC"
```

**Capa 3 — Suscripción del contribuyente:**
```
¿Está la suscripción CANCELADA sin trial vigente?
Sí → 403 "La suscripción del contribuyente está CANCELADA"
```

---

## 4. Usuarios, roles y permisos

### 4.1 Crear un usuario nuevo

Solo un usuario con permiso `guardar` en `/usuarios` puede crear otros usuarios. Hay dos formas:

**Opción A — Creando persona en el mismo request:**
```http
POST /auth/register
Authorization: Bearer <token_admin>

{
  "email": "contador@empresa.com",
  "password": "Pass123!",
  "rol_id": 2,
  "persona": {
    "nombre": "María",
    "apellido": "González",
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

**Opción B — Usando persona existente:**
```http
POST /auth/register
Authorization: Bearer <token_admin>

{
  "email": "contador@empresa.com",
  "password": "Pass123!",
  "rol_id": 2,
  "persona_id": 5
}
```

Al crear un usuario con `es_temporal: false` (por defecto), se envía automáticamente un email de bienvenida con las credenciales.

### 4.2 Configurar permisos de un rol

Los permisos se gestionan en `menu_rol`. Cada registro define qué puede hacer un rol en un menú:

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

### 4.3 Ciclo de sesión completo

```
1. Login
POST /auth/login
→ { access_token (8h), refresh_token (30d) }

2. Usar la API
Authorization: Bearer <access_token>

3. Renovar sesión (antes de que expire el access_token)
POST /auth/refresh
Body: { "refresh_token": "..." }
→ { access_token (nuevo 8h), refresh_token (nuevo 30d) }
   El refresh_token anterior queda revocado automáticamente.

4. Cerrar sesión
POST /auth/logout
Authorization: Bearer <access_token>
Body: { "refresh_token": "..." }
→ El refresh_token queda revocado en BD.
```

**Rotación de refresh token:** cada `/auth/refresh` invalida el anterior. Si un token robado ya fue rotado, el intento de usarlo falla con 401.

---

## 5. Contribuyentes y asignaciones

### 5.1 ¿Qué es un contribuyente?

Un contribuyente es la empresa o persona física con RUC que debe declarar ante la SET. En el sistema, cada contribuyente:
- Tiene un **RUC único** (sin dígito verificador, solo los dígitos)
- Está vinculado a una **persona** (persona_id) que es el responsable legal
- Puede tener una o más **suscripciones**
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

El RUC se valida como único — si ya existe, retorna `409 Conflict`.

### 5.3 Asignaciones contables

Para que un contador pueda procesar comprobantes de un contribuyente vía OCR, debe tener una asignación:

```http
POST /negocio/asignaciones-contables
Authorization: Bearer <token>

{
  "usuario_id": 4,
  "contribuyente_id": 2
}
```

**Sin asignación → 403 en OCR.** El sistema verifica esta relación en cada llamada al OCR.

Filtrar asignaciones de un usuario:
```http
GET /negocio/asignaciones-contables?usuario_id=4
GET /negocio/asignaciones-contables?contribuyente_id=2
```

---

## 6. Pipeline OCR — compra y venta

### 6.1 Flujo completo de procesamiento

```
1. Frontend toma la foto (cámara o galería)
2. POST /ocr-tax/extraer/compra  (o /venta)
   multipart/form-data:
     imagen: [archivo JPG/PNG/WebP, max 5MB]
     ruc:    "80123456"  (RUC del contribuyente, sin DV)
         │
         ▼
3. Validaciones de seguridad (3 capas)
         │
         ▼
4. sharp → convierte a WebP optimizado
         │
         ▼
5. Sube imagen a Cloudflare R2
         │
         ▼
6. Tesseract.js → extrae texto del WebP
   ¿Confianza < 75% o faltan campos clave?
   SÍ → Google Vision como fallback
         │
         ▼
7. RegexParserService → extrae campos fiscales:
   - RUC del emisor/cliente
   - Número de comprobante (###-###-#######)
   - Timbrado (8 dígitos)
   - Fecha de emisión
   - Monto total, gravada 10%, gravada 5%, exenta
         │
         ▼
8. InvoiceParaguayValidatorService → valida:
   - ¿gravada_10 + gravada_5 + exenta ≈ total?
   - ¿Timbrado dentro de vigencia?
   - ¿Campos mínimos presentes?
         │
         ▼
9. Busca el RUC en set_rucs → obtiene razón social y estado SET
   Si estado SET ≠ ACTIVO → marca REQUIERE_REVISION
         │
         ▼
10. ClasificadorGastoHelper → clasifica tipo IRP:
    ALIMENTACION, SALUD, EDUCACION, VIVIENDA, etc.
    (solo para compras)
         │
         ▼
11. Guarda en comprobantes / comprobantes_ventas
12. Guarda cápsula en ocr_entrenamientos
         │
         ▼
13. Respuesta:
    {
      "comprobante_id": 42,
      "estado_ocr": "AUTO_PROCESADO",
      "datos_identificados": { ... }
    }
```

### 6.2 Estados de un comprobante

| Estado | Significado | Acción requerida |
|---|---|---|
| `EN_COLA` | Creado manualmente, sin procesar | Ninguna |
| `PROCESANDO` | Un contador lo reclamó de la bolsa | El contador está revisando |
| `AUTO_PROCESADO` | OCR exitoso, cuadratura correcta | Ninguna — listo para RG90 |
| `REQUIERE_REVISION` | OCR dudoso, cuadratura incorrecta o RUC inactivo SET | Contador debe revisar y corregir |
| `VERIFICADO_HUMANO` | Contador revisó y confirmó | Listo para RG90 |
| `ERROR_PROCESAMIENTO` | Falla técnica grave en OCR | Reportar al administrador |

### 6.3 Diferencias entre compra y venta

| Campo | Compra (egreso) | Venta (ingreso) |
|---|---|---|
| Identificación del otro | `ruc_emisor` + `razon_social_emisor` | `ruc_cliente` + `razon_social_cliente` |
| Tipo de gasto IRP | `tipo_gasto` (ALIMENTACION, SALUD, etc.) | No aplica |
| `no_imputa` | Sí | No |
| `comprobante_asociado` | Sí (para notas débito/crédito) | No |
| Creación via OCR | `POST /ocr-tax/extraer/compra` | `POST /ocr-tax/extraer/venta` |
| Creación manual | `POST /negocio/comprobantes` | `POST /negocio/comprobantes-ventas` |

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

## 7. Bolsa de revisión

### 7.1 ¿Qué es la bolsa?

La bolsa es una cola de comprobantes que el OCR marcó como `REQUIERE_REVISION`. Funciona como un sistema de tickets: un contador "reclama" un comprobante para revisarlo, lo corrige y lo marca como verificado.

Evita que dos contadores trabajen el mismo comprobante al mismo tiempo (mutex por `revisor_id`).

### 7.2 Flujo de la bolsa

```
OCR detecta problema
      │
      ▼
Comprobante queda en estado REQUIERE_REVISION
revisor_id = NULL
      │
      ▼
GET /negocio/comprobantes/bolsa/pendientes
→ Lista de comprobantes sin revisor
?page=1&limit=20
      │
      ▼
Contador selecciona uno y lo reclama:
POST /negocio/comprobantes/bolsa/42/reclamar
→ { revisor_id: 4, estado_ocr: "PROCESANDO" }
      │
      ▼
Contador revisa la imagen en Cloudflare R2
(url_foto_webp del comprobante)
      │
      ▼
Contador corrige los datos:
PATCH /negocio/comprobantes/42
{
  "ruc_emisor": "80123456",
  "monto_total": 150000,
  "gravada_10": 136364,
  "iva_10": 13636,
  "estado_ocr": "VERIFICADO_HUMANO"
}
      │
      ▼
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

## 8. Exportación RG90 (Marangatu)

### 8.1 ¿Qué es el RG90?

La Resolución General 90 define el formato del archivo CSV que se carga en Marangatu para declarar compras y ventas. El sistema genera este archivo automáticamente.

### 8.2 Estructura del CSV

Cada línea representa un comprobante con 17 campos en orden exacto. Ejemplos:

**Compra (tipo registro = 2):**
```
2|001-001-0000123|12345678|01/06/2026|80123456|Supermercado SA|101|1|150000|136364|13636|0|0|0|S|N|S
```

**Venta (tipo registro = 1):**
```
1|001-002-0000456|87654321|15/06/2026|12345678|Cliente SA|101|1|200000|181818|18182|0|0|0|S|N|N
```

Reglas de formato:
- RUC sin dígito verificador
- Montos como enteros (sin decimales ni separadores)
- Fechas en `dd/mm/aaaa`
- Campos S/N para imputaciones

### 8.3 Generar el CSV

```http
# Por mes específico (junio 2026)
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026&mes=6
GET /negocio/exportaciones/rg90/ventas?contribuyente_id=1&anio=2026&mes=6

# Año completo
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026
GET /negocio/exportaciones/rg90/ventas?contribuyente_id=1&anio=2026
```

El response tiene `Content-Disposition: attachment; filename="RG90_COMPRAS_2026_6.csv"` — el browser/app lo descarga directamente.

> Solo incluye comprobantes con `deleted_at = NULL`. Los eliminados (soft delete) no aparecen en el CSV.

---

## 9. Suscripciones y Free Trial

### 9.1 Estados de suscripción

| Estado | Puede operar |
|---|---|
| `ACTIVO` | Sí |
| `MOROSO` | Sí (solo advertencia, sin bloqueo automático) |
| `CANCELADO` | No — 403 en POST comprobantes y GET exportaciones |
| `CANCELADO` + trial vigente | Sí hasta `trial_hasta` |

### 9.2 Crear suscripción normal

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

El contribuyente opera libremente hasta el 31/07/2026, luego queda bloqueado automáticamente.

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

## 10. Implementación frontend web

### 10.1 Flujo de autenticación

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

// 2. Interceptor Axios — agrega el token automáticamente
axios.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
  return config;
});

// 3. Interceptor de respuesta — renueva el token si expiró
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

### 10.2 Menú dinámico basado en permisos

Al hacer login, obtener los permisos del rol del usuario:

```javascript
// Después del login, cargar los permisos del rol
const { data: menus } = await axios.get(`/roles/${user.rol.id}/menus`);

// menus = [
//   { menu: { url: '/negocio/comprobantes', nombre: 'Comprobantes' },
//     permitir_listar: true, permitir_guardar: true, ... },
//   ...
// ]

// Renderizar el menú solo con los items que el rol puede listar
const menuVisible = menus.filter(m => m.permitir_listar);
```

**Lógica de botones:**
```javascript
// Solo mostrar botón "Nuevo" si puede guardar
if (permisos['/negocio/comprobantes']?.permitir_guardar) {
  showButton('nuevo-comprobante');
}

// Solo mostrar botón "Eliminar" si puede eliminar
if (permisos['/negocio/comprobantes']?.permitir_eliminar) {
  showButton('eliminar-comprobante');
}
```

### 10.3 Pantallas principales

**Dashboard / Home:**
- Resumen de comprobantes del mes (pendientes de revisión, procesados, total)
- Acceso rápido a bolsa de revisión
- Estado de suscripciones de los contribuyentes asignados

**Módulo de Comprobantes:**
```
GET /negocio/comprobantes?contribuyente_id=1&page=1&limit=20
GET /negocio/comprobantes?contribuyente_id=1&estado_ocr=REQUIERE_REVISION
GET /negocio/comprobantes?contribuyente_id=1&estado_ocr=AUTO_PROCESADO
```

**Bolsa de revisión:**
```
GET /negocio/comprobantes/bolsa/pendientes?page=1&limit=20
→ Mostrar lista con imagen (url_foto_webp), datos detectados
→ Botón "Reclamar" → POST /negocio/comprobantes/bolsa/:id/reclamar
→ Formulario de corrección → PATCH /negocio/comprobantes/:id
→ Botón "Verificar" → PATCH con { estado_ocr: "VERIFICADO_HUMANO" }
```

**Exportación:**
```
Seleccionar: contribuyente + año + mes (opcional)
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026&mes=6
→ Descarga automática del CSV
```

### 10.4 Manejo de errores HTTP

| Código | Causa | Acción en UI |
|---|---|---|
| 400 | Validación DTO fallida | Mostrar campos con error del `message` |
| 401 | Token expirado | Intentar refresh, si falla → logout |
| 403 | Sin permiso | Mostrar "Sin acceso a esta función" |
| 403 | Suscripción CANCELADA | Mostrar aviso de suscripción vencida |
| 404 | Recurso no encontrado | Mostrar "No encontrado" |
| 409 | Duplicado (RUC, comprobante) | Mostrar "Ya existe" |
| 429 | Rate limit | Mostrar "Demasiados intentos, espere" |

---

## 11. Implementación app móvil

### 11.1 Diferencias clave con la web

| Aspecto | Web | App Móvil |
|---|---|---|
| Tokens | `localStorage` | `SecureStorage` / Keychain |
| OCR | Subida de imagen existente | Cámara en tiempo real |
| Refresh | Interceptor Axios | Interceptor HTTP del framework |
| Menú | Sidebar completo | Bottom navigation simplificado |
| Offline | No aplica | Cache de comprobantes pendientes |

### 11.2 Flujo de captura con cámara (caso principal)

```
1. Usuario abre la app → pantalla principal del contribuyente

2. Toca botón "Escanear Factura"

3. App abre cámara nativa

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

8. Según estado_ocr de la respuesta:
   AUTO_PROCESADO    → "✓ Factura registrada correctamente"
   REQUIERE_REVISION → "⚠ Necesita revisión manual"
   Error 400         → Mostrar mensaje específico

9. Mostrar pantalla de confirmación con datos detectados
   permitiendo corrección antes de confirmar
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

### 11.4 Flujo offline básico

Para cuando el usuario no tiene conexión:

```
1. Toma la foto y guarda localmente con el RUC
2. App muestra "Guardado localmente — se enviará cuando haya conexión"
3. Al recuperar conexión, la app intenta subir los pendientes
4. POST /ocr-tax/extraer/compra para cada pendiente local
```

### 11.5 Pantallas recomendadas para la app

```
Login
  └── Home (resumen del contribuyente activo)
       ├── Escanear Compra
       ├── Escanear Venta
       ├── Mis Comprobantes (lista paginada con filtros)
       ├── Bolsa de Revisión (solo roles con permisos)
       └── Exportar RG90 (descarga o comparte el CSV)
```

---

## 12. Cómo testear la API

### 12.1 Usando la colección Postman

El archivo `collection/Facturacion-IVA.postman_collection.json` contiene 100+ requests listos. Para importar:

1. Abrir Postman → Import → subir el archivo
2. Configurar variables de colección:
   - `baseUrl`: `http://localhost:9031`
   - `token`: (se llena con el access_token del login)
   - `apiKey`: (para endpoints de departamento/ciudad)

### 12.2 Credenciales de prueba (seed)

```
email:    admin@sistema.com
password: 12356
rol:      Administrador (acceso total)
```

### 12.3 Flujo de prueba completo paso a paso

```
PASO 1 — Obtener token
POST /auth/login
{ "email": "admin@sistema.com", "password": "12356" }
→ Copiar access_token a la variable {{token}}

PASO 2 — Crear una persona
POST /personas
{ "nombre": "Juan", "apellido": "García", "sexo": "M" }
→ Anotar el id

PASO 3 — Crear un contribuyente
POST /negocio/contribuyentes
{ "ruc": "80123456", "razon_social": "Juan SA", "persona_id": <id del paso 2> }
→ Anotar el id (ej: contribuyente_id = 1)

PASO 4 — Crear suscripción
POST /cobranzas/suscripciones
{ "contribuyente_id": 1, "estado": "ACTIVO", "fecha_inicio": "2026-01-01" }

PASO 5 — Crear usuario contador
POST /auth/register
{ "email": "contador@empresa.com", "password": "Pass123!", "rol_id": 2,
  "persona": { "nombre": "Ana", "apellido": "López", "sexo": "F",
    "documentos": [{ "tipo_documento_id": 1, "numero": "1234567" }] } }
→ Anotar el id del usuario

PASO 6 — Asignar el contador al contribuyente
POST /negocio/asignaciones-contables
{ "usuario_id": <id contador>, "contribuyente_id": 1 }

PASO 7 — Login como contador
POST /auth/login
{ "email": "contador@empresa.com", "password": "Pass123!" }
→ Copiar nuevo access_token a {{token}}

PASO 8 — Cargar comprobante manual
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

PASO 9 — Exportar CSV RG90
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026&mes=6
→ Descarga RG90_COMPRAS_2026_6.csv
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

### 12.5 Testear la bolsa de revisión

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

5. Verificar que ocr_entrenamientos se actualizó
   (no hay endpoint directo — verificar en BD)
```

### 12.6 Testear el guard de suscripción

```
1. Crear suscripción CANCELADA sin trial
   POST /cobranzas/suscripciones
   { "contribuyente_id": 1, "estado": "CANCELADO", "fecha_inicio": "2026-01-01" }

2. Intentar cargar comprobante → debe retornar 403
   POST /negocio/comprobantes
   { "contribuyente_id": 1, ... }

3. Activar free trial
   PATCH /cobranzas/suscripciones/1
   { "es_trial": true, "trial_hasta": "2026-12-31" }

4. Reintentar el POST → ahora debe funcionar
```

### 12.7 Verificar el límite de rate en login

```bash
# Enviar 6 requests en menos de 1 minuto
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:9031/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Los primeros 5 → 401, el 6to → 429
```

---

## Apéndice — Chequeo de estado final (2026-06-05)

### API completa ✅

| Módulo | Endpoints | Estado |
|---|---|---|
| Auth | login, me, refresh, logout, register, forgot/reset/cambiar-password | ✅ |
| Personas | CRUD + paginación | ✅ |
| Usuarios | CRUD + paginación + email bienvenida | ✅ |
| Persona Documentos | CRUD | ✅ |
| Contribuyentes | CRUD + paginación + soft delete | ✅ |
| Comprobantes Compra | CRUD + paginación + filtro estado + bolsa paginada + soft delete | ✅ |
| Comprobantes Venta | CRUD + paginación + filtro estado + bolsa paginada + soft delete | ✅ |
| OCR Compra | Pipeline completo 3 capas de seguridad | ✅ |
| OCR Venta | Pipeline completo (paridad con compra) | ✅ |
| Exportaciones RG90 | Compras y ventas por mes/año + SuscripcionGuard | ✅ |
| Asignaciones Contables | CRUD + paginación + filtros | ✅ |
| Suscripciones | CRUD + paginación + filtro contribuyente | ✅ |
| Cuotas de Pago | CRUD + paginación + filtro suscripcion | ✅ |
| Roles | CRUD + GET menus del rol | ✅ |
| Menú / Grupo Menú / Menu-Rol | CRUD configuración sistema | ✅ |
| Tipos de Documento | CRUD | ✅ |
| País | CRUD + carga masiva (JWT) | ✅ |
| Departamento / Ciudad | CRUD + carga masiva (ApiKeyGuard) | ✅ |

### Gaps funcionales conocidos (fuera del alcance actual)

| Gap | Impacto |
|---|---|
| Módulo de planes/tiers | SaaS con límites de uso por plan |
| email_contacto en personas | Mejora menor |
| comprobante_asociado en ventas | Notas débito/crédito de ventas |
| Auditoría de cambios en comprobantes | Trazabilidad de ediciones |
