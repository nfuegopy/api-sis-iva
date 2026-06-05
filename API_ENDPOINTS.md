# Facturación IVA — Documentación de Endpoints

**Base URL:** `http://localhost:9031`  
**Puerto producción:** `9031`  
**Formato:** JSON (`Content-Type: application/json`), salvo OCR (multipart/form-data)

---

## Autenticación

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <access_token>
```

El token se obtiene haciendo `POST /auth/login`. Dura **8 horas**.

---

## Paginación

Los endpoints de listado aceptan query params opcionales:
```
?page=1&limit=20
```
- `page`: número de página (default: 1)
- `limit`: registros por página (default: 20, máximo: 100)

Todos responden:
```json
{
  "data": [...],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

## Guards disponibles

| Guard | Descripción |
|---|---|
| `JwtAuthGuard` | Requiere `Authorization: Bearer <token>` válido |
| `MenuRolGuard` | Verifica que el rol del usuario tenga permiso para el método HTTP en esa ruta |
| `SuscripcionGuard` | Bloquea si la suscripción del contribuyente está CANCELADA y sin trial vigente |
| `ApiKeyGuard` | Requiere header `x-api-key: <API_KEY>` (solo endpoints geográficos) |
| `Throttle (login)` | Máximo 5 intentos por minuto por IP |

---

## 1. Autenticación (`/auth`)

### POST /auth/login
Autentica un usuario y devuelve tokens JWT.  
**Guard:** Throttle 5 req/min  

**Body:**
```json
{
  "email": "admin@sistema.com",
  "password": "12356"
}
```

**Respuesta exitosa (200):**
```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "7137c9efa...",
  "user": {
    "id": 1,
    "email": "admin@sistema.com",
    "nombre": "Admin",
    "apellido": "Sistema",
    "rol": {
      "id": 1,
      "nombre": "Administrador"
    }
  }
}
```

**Errores:** `401` credenciales inválidas, `429` demasiados intentos.

---

### GET /auth/me
Devuelve el perfil completo del usuario autenticado.  
**Guard:** `JwtAuthGuard`

**Respuesta (200):**
```json
{
  "id": 1,
  "email": "admin@sistema.com",
  "activo": true,
  "rol_id": 1,
  "persona_id": 1,
  "persona": { "nombre": "Admin", "apellido": "Sistema" },
  "rol": { "id": 1, "nombre": "Administrador" }
}
```
> El campo `password` nunca se devuelve.

---

### POST /auth/refresh
Rota el refresh token y devuelve nuevos tokens. El token anterior queda inválido.  
**Guard:** Público

**Body:**
```json
{
  "refresh_token": "7137c9efaed6b48bd2800c2dedca388..."
}
```

**Respuesta (200):**
```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "nuevo_refresh_token_64hex..."
}
```

**Errores:** `401` token inválido o ya rotado.

---

### POST /auth/logout
Revoca el refresh token activo. El access_token sigue siendo válido hasta expirar (8h).  
**Guard:** `JwtAuthGuard`

**Body:**
```json
{
  "refresh_token": "7137c9efaed6b48bd2800c2dedca388..."
}
```

**Respuesta (200):**
```json
{ "message": "Sesión cerrada correctamente." }
```

---

### POST /auth/register
Registra un nuevo usuario. Requiere permiso de guardar en `/usuarios`.  
**Guard:** `JwtAuthGuard` + `MenuRolGuard`

**Body (con persona nueva):**
```json
{
  "email": "contador@empresa.com",
  "password": "Password123",
  "rol_id": 2,
  "persona": {
    "nombre": "Carlos",
    "apellido": "González",
    "telefono": "0981234567",
    "documentos": [
      { "tipo_documento_id": 1, "numero": "4567890" }
    ]
  }
}
```

**Body (con persona existente):**
```json
{
  "email": "contador@empresa.com",
  "password": "Password123",
  "rol_id": 2,
  "persona_id": 5
}
```

**Respuesta (201):** Objeto `Usuario` creado.  
**Nota:** Se envía email de bienvenida automáticamente.

---

### POST /auth/forgot-password
Envía un email con enlace de recuperación (válido 1 hora).  
**Guard:** Público

**Body:**
```json
{ "email": "admin@sistema.com" }
```

**Respuesta (200):**
```json
{ "message": "Correo de recuperación enviado." }
```

---

### POST /auth/reset-password
Restablece la contraseña usando el token del email.  
**Guard:** Público

**Body:**
```json
{
  "token": "a3f8c2d1e4b7...",
  "nueva_password": "NuevoPassword123"
}
```

**Respuesta (200):**
```json
{ "message": "Contraseña actualizada correctamente." }
```

---

### POST /auth/cambiar-password
Cambia la contraseña del usuario autenticado, requiriendo la contraseña actual.  
**Guard:** `JwtAuthGuard`

**Body:**
```json
{
  "password_actual": "12356",
  "nueva_password": "NuevoPassword456"
}
```

**Respuesta (200):**
```json
{ "message": "Contraseña actualizada correctamente." }
```

---

## 2. Personas (`/personas`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/personas`)

### POST /personas
Crea una persona con sus documentos de identidad.

**Body:**
```json
{
  "nombre": "Antonio",
  "apellido": "Barrios",
  "telefono": "0971234567",
  "direccion": "Av. Mariscal López 1234, Asunción",
  "ciudad_id": 1,
  "documentos": [
    {
      "tipo_documento_id": 1,
      "numero": "5123456",
      "fecha_vencimiento": "2030-12-31"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `nombre` | string | ✅ | Nombre de la persona |
| `apellido` | string | ✅ | Apellido |
| `telefono` | string | ❌ | Teléfono de contacto |
| `direccion` | string | ❌ | Dirección |
| `ciudad_id` | number | ❌ | ID de ciudad |
| `documentos` | array | ✅ | Al menos 1 documento |
| `documentos[].tipo_documento_id` | number | ✅ | ID del tipo de documento |
| `documentos[].numero` | string | ✅ | Número del documento |
| `documentos[].fecha_vencimiento` | date | ❌ | Vencimiento (YYYY-MM-DD) |

**Respuesta (201):** Objeto `Persona` con sus documentos.

---

### GET /personas
Lista personas con paginación.

**Query params:** `?page=1&limit=20`

---

### GET /personas/:id
Obtiene una persona por ID.

---

### PATCH /personas/:id
Actualiza datos de una persona. Todos los campos son opcionales.

**Body (ejemplo parcial):**
```json
{
  "telefono": "0999887766",
  "documentos": [
    { "id": 3, "numero": "5123456-actualizado" }
  ]
}
```

---

### DELETE /personas/:id
Elimina una persona.

**Respuesta:**
```json
{ "message": "La persona con el ID 1 ha sido eliminada." }
```

---

## 3. Usuarios (`/usuarios`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/usuarios`)

### POST /usuarios
Crea un usuario vinculado a una persona existente o nueva.

**Body (con persona nueva):**
```json
{
  "email": "nuevo@empresa.com",
  "password": "SecurePass123",
  "rol_id": 2,
  "persona": {
    "nombre": "María",
    "apellido": "López",
    "documentos": [
      { "tipo_documento_id": 1, "numero": "3456789" }
    ]
  }
}
```

**Body (con persona_id existente):**
```json
{
  "email": "nuevo@empresa.com",
  "password": "SecurePass123",
  "rol_id": 2,
  "persona_id": 7
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `email` | string | ✅ | Email único |
| `password` | string | ✅ | Contraseña en texto plano (se hashea con bcrypt) |
| `rol_id` | number | ✅ | ID del rol (1=Admin, 2=Contador, 3=Solo Lectura) |
| `persona_id` | number | ❌ | ID de persona existente |
| `persona` | object | ❌ | Datos para crear persona nueva (si no hay `persona_id`) |

**Nota:** Se debe enviar `persona_id` O `persona`, no ambos.

---

### GET /usuarios
Lista usuarios con paginación.

**Query params:** `?page=1&limit=20`

---

### GET /usuarios/:id
Obtiene un usuario por ID.

---

### PATCH /usuarios/:id
Actualiza un usuario. Si se envía `password`, se hashea automáticamente.

**Body:**
```json
{
  "password": "NuevoPassword789",
  "rol_id": 3
}
```

---

### DELETE /usuarios/:id
Elimina un usuario.

---

## 4. Persona Documentos (`/persona-documentos`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/persona-documentos`)

CRUD estándar para gestionar documentos de identidad de personas en forma independiente.

### POST /persona-documentos

**Body:**
```json
{
  "persona_id": 5,
  "tipo_documento_id": 1,
  "numero": "7654321",
  "fecha_vencimiento": "2028-06-30"
}
```

### GET /persona-documentos
Lista todos los documentos.

### GET /persona-documentos/:id
### PATCH /persona-documentos/:id
### DELETE /persona-documentos/:id

---

## 5. Contribuyentes (`/negocio/contribuyentes`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/negocio/contribuyentes`)  
**Soft delete:** Los registros eliminados no se borran físicamente (campo `deleted_at`).

### POST /negocio/contribuyentes
Registra un contribuyente (empresa con RUC).

**Body:**
```json
{
  "persona_id": 3,
  "ruc": "80123456",
  "dv": 7,
  "razon_social": "Empresa SA",
  "tipo_impuesto": "IVA_IRE"
}
```

| Campo | Tipo | Requerido | Valores válidos |
|---|---|---|---|
| `persona_id` | number | ✅ | ID de persona existente |
| `ruc` | string | ✅ | RUC sin dígito verificador (máx 20 chars) |
| `dv` | number | ✅ | Dígito verificador |
| `razon_social` | string | ✅ | Nombre legal (máx 255 chars) |
| `tipo_impuesto` | enum | ✅ | `IVA`, `IVA_IRE`, `IVA_IRP`, `IVA_IRE_IRP` |

**Errores:** `409` si el RUC ya existe.

---

### GET /negocio/contribuyentes
**Query params:** `?page=1&limit=20`

---

### GET /negocio/contribuyentes/:id
### PATCH /negocio/contribuyentes/:id
### DELETE /negocio/contribuyentes/:id (soft delete)

---

## 6. Comprobantes de Compra (`/negocio/comprobantes`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/negocio/comprobantes`)  
**Soft delete activo.** Los POST además tienen `SuscripcionGuard`.

### POST /negocio/comprobantes
Registra un comprobante de compra manualmente.

**Body:**
```json
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

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `contribuyente_id` | number | ✅ | ID del contribuyente propietario |
| `nro_comprobante` | string | ✅ | Formato exacto: `###-###-#######` |
| `timbrado` | string | ✅ | 8 dígitos exactos |
| `ruc_emisor` | string | ✅ | RUC del emisor (con o sin DV) |
| `razon_social_emisor` | string | ✅ | Nombre del emisor |
| `fecha_emision` | date | ✅ | Formato `YYYY-MM-DD` |
| `monto_total` | number | ✅ | Total en guaraníes (mínimo: 1) |
| `gravada_10` | number | ❌ | Base gravada al 10% |
| `gravada_5` | number | ❌ | Base gravada al 5% |
| `exenta` | number | ❌ | Monto exento |
| `iva_10` | number | ❌ | IVA al 10% |
| `iva_5` | number | ❌ | IVA al 5% |
| `tipo_comprobante_set` | number | ❌ | Código SET: 101-112, 201-211 |
| `condicion_operacion` | number | ❌ | `1`=contado, `2`=crédito |
| `imputa_iva` | string | ❌ | `"S"` o `"N"` |
| `imputa_ire` | string | ❌ | `"S"` o `"N"` |
| `imputa_irp` | string | ❌ | `"S"` o `"N"` |
| `no_imputa` | string | ❌ | `"S"` o `"N"` |
| `moneda_extranjera` | string | ❌ | `"S"` o `"N"` |
| `tipo_gasto` | enum | ❌ | Clasificación IRP gasto |
| `comprobante_asociado` | string | ❌ | Para notas crédito/débito: `###-###-#######` |
| `timbrado_asociado` | string | ❌ | Timbrado del comprobante original |

**Errores:** `409` si ya existe el mismo timbrado + nro_comprobante para ese contribuyente y emisor.

---

### GET /negocio/comprobantes
**Query params:** `?page=1&limit=20&contribuyente_id=1`

---

### GET /negocio/comprobantes/:id
### PATCH /negocio/comprobantes/:id
### DELETE /negocio/comprobantes/:id (soft delete)

---

### GET /negocio/comprobantes/bolsa/pendientes
Lista comprobantes en estado `REQUIERE_REVISION` aún sin contador asignado (revisión pendiente).

**Respuesta:**
```json
[
  {
    "id": 42,
    "nro_comprobante": "001-001-0000099",
    "estado_ocr": "REQUIERE_REVISION",
    "revisor_id": null,
    "contribuyente": { "razon_social": "Empresa SA" }
  }
]
```

---

### POST /negocio/comprobantes/bolsa/:id/reclamar
Un contador reclama un comprobante para su revisión. Protege contra doble reclamo concurrente.

**Respuesta:**
```json
{
  "mensaje": "Comprobante asignado exitosamente a tu bandeja",
  "comprobante": { ... }
}
```

---

## 7. Comprobantes de Venta (`/negocio/comprobantes-ventas`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/negocio/comprobantes-ventas`)  
**Soft delete activo.** Los POST tienen `SuscripcionGuard`.

### POST /negocio/comprobantes-ventas

**Body:**
```json
{
  "contribuyente_id": 1,
  "nro_comprobante": "001-001-0001500",
  "timbrado": "87654321",
  "fecha_emision": "2026-06-01",
  "ruc_cliente": "12345678-9",
  "razon_social_cliente": "Cliente SA",
  "monto_total": 500000,
  "gravada_10": 454545,
  "iva_10": 45455,
  "tipo_comprobante_set": 101,
  "condicion_operacion": 1
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `contribuyente_id` | number | ✅ | ID del contribuyente emisor |
| `nro_comprobante` | string | ✅ | Formato `###-###-#######` |
| `timbrado` | string | ✅ | 8 dígitos |
| `fecha_emision` | date | ✅ | `YYYY-MM-DD` |
| `ruc_cliente` | string | ✅ | RUC del cliente comprador |
| `razon_social_cliente` | string | ✅ | Nombre del cliente |
| `monto_total` | number | ✅ | Total en guaraníes |
| `gravada_10` | number | ❌ | Base gravada al 10% |
| `gravada_5` | number | ❌ | Base gravada al 5% |
| `exenta` | number | ❌ | Monto exento |
| `iva_10` | number | ❌ | IVA calculado 10% |
| `iva_5` | number | ❌ | IVA calculado 5% |
| `tipo_comprobante_set` | number | ❌ | Código SET (101-211) |
| `condicion_operacion` | number | ❌ | `1`=contado, `2`=crédito |
| `moneda_extranjera` | string | ❌ | `"S"` o `"N"` |
| `imputa_iva` | string | ❌ | `"S"` o `"N"` |
| `imputa_ire` | string | ❌ | `"S"` o `"N"` |
| `imputa_irp` | string | ❌ | `"S"` o `"N"` |

---

### GET /negocio/comprobantes-ventas
**Query params:** `?page=1&limit=20&contribuyente_id=1`

### GET /negocio/comprobantes-ventas/:id
### PATCH /negocio/comprobantes-ventas/:id
### DELETE /negocio/comprobantes-ventas/:id

### GET /negocio/comprobantes-ventas/bolsa/pendientes
### POST /negocio/comprobantes-ventas/bolsa/:id/reclamar
(Misma lógica que compras.)

---

## 8. OCR — Extracción Automática (`/ocr-tax`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/ocr-tax`) + capa 2 (asignación) + capa 3 (suscripción)  
**Content-Type:** `multipart/form-data`

### Pipeline de procesamiento
1. Verifica JWT y permisos del rol
2. Verifica que el usuario tenga asignación contable para el RUC enviado
3. Verifica que el contribuyente tenga suscripción activa o trial vigente
4. Valida el archivo (JPEG/PNG/WebP, máx 5 MB)
5. Convierte imagen a WebP con sharp y sube a Cloudflare R2
6. Procesa con Tesseract.js (primario)
7. Si confianza < 75% o faltan campos → fallback a Google Vision
8. Extrae y valida datos fiscales (cuadratura matemática, formato timbrado)
9. Consulta SET RUC para razón social y estado
10. Guarda en comprobantes + cápsula de entrenamiento OCR
11. Devuelve `AUTO_PROCESADO` o `REQUIERE_REVISION`

---

### POST /ocr-tax/extraer/compra
Procesa una imagen de factura de compra (gasto del contribuyente).

**Form-data:**
| Campo | Tipo | Requerido |
|---|---|---|
| `imagen` | File | ✅ JPG/PNG/WebP, máx 5MB |
| `ruc` | string | ✅ RUC del contribuyente (ej: `80123456` o `80123456-7`) |

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Gasto procesado correctamente",
  "comprobante_id": 15,
  "estado_ocr": "AUTO_PROCESADO",
  "datos_identificados": {
    "ruc": "80123456-7",
    "nroComprobante": "001-001-0000567",
    "timbrado": "12345678",
    "fechaEmision": "01/06/2026",
    "total": "150000",
    "gravada10": "136364"
  }
}
```

**Errores comunes:**
- `400` archivo vacío, MIME no permitido, o imagen no reconocida como comprobante
- `403` sin asignación contable para ese RUC
- `403` suscripción CANCELADA sin trial vigente

---

### POST /ocr-tax/extraer/venta
Procesa una imagen de factura emitida por el contribuyente.

**Form-data:** igual que `/extraer/compra`

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Ingreso (Venta) procesado correctamente",
  "comprobante_venta_id": 8,
  "datos_identificados": { ... }
}
```

---

## 9. Exportaciones RG90 (`/negocio/exportaciones`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/negocio/exportaciones`)  
**Respuesta:** Archivo CSV descargable (formato Marangatu/SET RG90)

### GET /negocio/exportaciones/rg90/compras
Exporta comprobantes de compra en formato CSV compatible con Marangatu.

**Query params:**
| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `contribuyente_id` | number | ✅ | ID del contribuyente |
| `anio` | number | ✅ | Año (ej: `2026`) |
| `mes` | number | ❌ | Mes 1-12 (si no se envía, exporta todo el año) |

**Ejemplo:**
```
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026&mes=6
```

**Respuesta:** Descarga del archivo `RG90_COMPRAS_2026_6.csv`

---

### GET /negocio/exportaciones/rg90/ventas
Mismos parámetros que compras.

**Ejemplo:**
```
GET /negocio/exportaciones/rg90/ventas?contribuyente_id=1&anio=2026
```

**Respuesta:** Descarga del archivo `RG90_VENTAS_2026_COMPLETO.csv`

---

## 10. Asignaciones Contables (`/negocio/asignaciones-contables`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/negocio/asignaciones-contables`)

Vincula un usuario (contador) con un contribuyente (empresa). Es la **capa 2 de seguridad del OCR**: un contador solo puede procesar comprobantes de las empresas que tiene asignadas.

### POST /negocio/asignaciones-contables

**Body:**
```json
{
  "usuario_id": 3,
  "contribuyente_id": 1
}
```

**Errores:** `409` si la asignación ya existe.

---

### GET /negocio/asignaciones-contables
**Query params:** `?page=1&limit=20&usuario_id=3&contribuyente_id=1`

### GET /negocio/asignaciones-contables/:id
### PATCH /negocio/asignaciones-contables/:id
### DELETE /negocio/asignaciones-contables/:id

---

## 11. Suscripciones (`/cobranzas/suscripciones`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/cobranzas/suscripciones`)

Controla el estado de acceso de cada contribuyente al sistema (modelo SaaS).

### POST /cobranzas/suscripciones

**Body (suscripción normal):**
```json
{
  "contribuyente_id": 1,
  "estado": "ACTIVO",
  "fecha_inicio": "2026-06-01"
}
```

**Body (con free trial):**
```json
{
  "contribuyente_id": 2,
  "estado": "CANCELADO",
  "fecha_inicio": "2026-06-01",
  "es_trial": true,
  "trial_hasta": "2026-07-31"
}
```

| Campo | Tipo | Requerido | Valores / Descripción |
|---|---|---|---|
| `contribuyente_id` | number | ✅ | ID del contribuyente |
| `estado` | enum | ❌ | `ACTIVO`, `MOROSO`, `CANCELADO` (default: `ACTIVO`) |
| `fecha_inicio` | date | ✅ | Fecha de inicio `YYYY-MM-DD` |
| `es_trial` | boolean | ❌ | Si es período de prueba gratuito |
| `trial_hasta` | date | ❌ | Fecha límite del trial `YYYY-MM-DD` |

> Con `es_trial: true` y `trial_hasta` en el futuro, el contribuyente puede operar aunque el estado sea `CANCELADO`.

---

### GET /cobranzas/suscripciones
**Query params:** `?page=1&limit=20&contribuyente_id=1`

### GET /cobranzas/suscripciones/:id
### PATCH /cobranzas/suscripciones/:id
### DELETE /cobranzas/suscripciones/:id

---

## 12. Cuotas de Pago (`/cobranzas/cuotas-pagos`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/cobranzas/cuotas-pagos`)

Registra los pagos de cuotas asociados a una suscripción.

### POST /cobranzas/cuotas-pagos

**Body:**
```json
{
  "suscripcion_id": 1,
  "monto": 150000,
  "fecha_vencimiento": "2026-07-01",
  "fecha_pago": "2026-06-28",
  "estado": "PAGADO"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `suscripcion_id` | number | ✅ | ID de la suscripción |
| `monto` | number | ✅ | Monto en guaraníes |
| `fecha_vencimiento` | date | ✅ | `YYYY-MM-DD` |
| `fecha_pago` | date | ❌ | `YYYY-MM-DD` (nulo si no pagado) |
| `estado` | enum | ❌ | `PENDIENTE`, `PAGADO`, `VENCIDO` |

---

### GET /cobranzas/cuotas-pagos
**Query params:** `?page=1&limit=20&suscripcion_id=1`

### GET /cobranzas/cuotas-pagos/:id
### PATCH /cobranzas/cuotas-pagos/:id
### DELETE /cobranzas/cuotas-pagos/:id

---

## 13. Roles (`/roles`)

**Guard:** `JwtAuthGuard` (sin MenuRolGuard — configuración del sistema)

### POST /roles
```json
{ "nombre": "Auditor", "descripcion": "Acceso de solo lectura a comprobantes" }
```

### GET /roles
Lista todos los roles.

### GET /roles/:id
### PATCH /roles/:id
### DELETE /roles/:id

### GET /roles/:id/menus
Devuelve los grupos de menú y sus permisos configurados para ese rol. Útil para que el frontend construya el menú dinámico.

**Respuesta:**
```json
[
  {
    "grupo": "Negocio",
    "menus": [
      {
        "menu_id": 1,
        "nombre": "Comprobantes",
        "url": "/negocio/comprobantes",
        "listar": true,
        "guardar": true,
        "editar": true,
        "eliminar": false
      }
    ]
  }
]
```

---

## 14. Menús (`/menu`)

**Guard:** `JwtAuthGuard`

### POST /menu
```json
{
  "nombre": "Exportaciones",
  "descripcion": "Exportar archivos RG90",
  "grupo_menu_id": 2,
  "url": "/negocio/exportaciones",
  "icono": "download"
}
```

### GET /menu
### GET /menu/:id
### PATCH /menu/:id
### DELETE /menu/:id

---

## 15. Grupos de Menú (`/grupo-menu`)

**Guard:** `JwtAuthGuard`

### POST /grupo-menu
```json
{
  "nombre": "Administración",
  "descripcion": "Módulos de configuración del sistema",
  "icono": "settings"
}
```

### GET /grupo-menu
### GET /grupo-menu/:id
### PATCH /grupo-menu/:id
### DELETE /grupo-menu/:id

---

## 16. Permisos Menú-Rol (`/menu-rol`)

**Guard:** `JwtAuthGuard`

Asigna permisos granulares (listar/guardar/editar/eliminar) a un rol para un menú específico.

### POST /menu-rol
```json
{
  "menu_id": 1,
  "rol_id": 2,
  "permitir_listar": true,
  "permitir_guardar": true,
  "permitir_editar": true,
  "permitir_eliminar": false
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `menu_id` | number | ID del menú |
| `rol_id` | number | ID del rol |
| `permitir_listar` | boolean | Permiso para GET (listar) |
| `permitir_guardar` | boolean | Permiso para POST (crear) |
| `permitir_editar` | boolean | Permiso para PATCH/PUT (editar) |
| `permitir_eliminar` | boolean | Permiso para DELETE (eliminar) |

### GET /menu-rol
### GET /menu-rol/:id
### PATCH /menu-rol/:id
### DELETE /menu-rol/:id

---

## 17. Tipos de Documento (`/tipos-documento`)

**Guard:** `JwtAuthGuard`

### POST /tipos-documento
```json
{
  "nombre": "Cédula de Identidad",
  "codigo": "CI"
}
```

### GET /tipos-documento
### GET /tipos-documento/:id
### PATCH /tipos-documento/:id
### DELETE /tipos-documento/:id

---

## 18. Países (`/pais`)

**Guard:** `JwtAuthGuard`

### POST /pais
```json
{ "nombre": "Paraguay" }
```

### POST /pais/masivo
Carga masiva de países.
```json
[
  { "nombre": "Paraguay" },
  { "nombre": "Argentina" },
  { "nombre": "Brasil" }
]
```

### GET /pais
**Query params:** `?nombre=Paraguay` (filtro opcional por nombre)

### GET /pais/:id
### PATCH /pais/:id
### DELETE /pais/:id

---

## 19. Departamentos (`/departamento`)

**Guard:** `ApiKeyGuard` — Requiere header `x-api-key: <API_KEY>`

### POST /departamento
```json
{
  "nombre": "Central",
  "pais_id": 1
}
```

### POST /departamento/masivo
```json
[
  { "nombre": "Central", "pais_id": 1 },
  { "nombre": "Alto Paraná", "pais_id": 1 }
]
```

### GET /departamento
**Query params:** `?nombre=Central`

### GET /departamento/:id
### PATCH /departamento/:id
### DELETE /departamento/:id

---

## 20. Ciudades (`/ciudad`)

**Guard:** `ApiKeyGuard` — Requiere header `x-api-key: <API_KEY>`

### POST /ciudad
```json
{
  "nombre": "Asunción",
  "departamento_id": 1
}
```

### POST /ciudad/masivo
```json
[
  { "nombre": "Asunción", "departamento_id": 1 },
  { "nombre": "San Lorenzo", "departamento_id": 1 }
]
```

### GET /ciudad
**Query params:** `?nombre=Asunción`

### GET /ciudad/:id
### PATCH /ciudad/:id
### DELETE /ciudad/:id

---

## Códigos de tipo de comprobante SET

| Código | Descripción |
|---|---|
| 101 | Factura |
| 102 | Nota de débito |
| 103 | Nota de crédito |
| 104 | Autofactura |
| 105 | Nota de remisión |
| 106 | Comprobante de retención |
| 107 | Comprobante de liquidación |
| 108 | Liquidación de compra a pequeño productor |
| 109 | Ticket (POS) |
| 110 | Entrada de dinero |
| 111 | Salida de dinero |
| 112 | Nota de venta |
| 201 | Factura electrónica (E-Factura) |
| 202 | Nota de débito electrónica |
| 203 | Nota de crédito electrónica |
| 204 | Autofactura electrónica |
| 205 | Nota de remisión electrónica |
| 206 | Comprobante de retención electrónico |
| 207 | Comprobante de liquidación electrónico |
| 208 | Liquidación de compra a pequeño productor electrónica |
| 209 | Ticket electrónico |
| 210 | Entrada de dinero electrónica |
| 211 | Salida de dinero electrónica |

---

## Roles del sistema

| ID | Nombre | Acceso |
|---|---|---|
| 1 | Administrador | LGED (Listar, Guardar, Editar, Eliminar) en todo |
| 2 | Contador | Acceso operativo (comprobantes, OCR, exportaciones) |
| 3 | Solo Lectura | Solo consulta, sin crear/editar/eliminar |

---

## Credenciales de prueba

| Campo | Valor |
|---|---|
| Email | `admin@sistema.com` |
| Password | `12356` |
| URL base | `http://localhost:9031` |
