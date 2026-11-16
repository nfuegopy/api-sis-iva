# FacturaciÃ³n IVA â€” DocumentaciÃ³n de Endpoints

> ⚠️ **Corregido P0.7** C1: Autoridad .ai-work.

**Base URL QA:** `https://api-qa.acbldeveloper.com`  
**Base URL local:** `http://localhost:9031`  
**Puerto:** configurable vÃ­a variable de entorno `PORT` (default: `9031`)  
**Formato:** JSON (`Content-Type: application/json`), salvo OCR (multipart/form-data)

---

## AutenticaciÃ³n

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <access_token>
```

El token se obtiene haciendo `POST /auth/login`. Dura **8 horas**.

---

## PaginaciÃ³n

Los endpoints de listado aceptan query params opcionales:
```
?page=1&limit=20
```
- `page`: nÃºmero de pÃ¡gina (default: 1)
- `limit`: registros por pÃ¡gina (default: 20, mÃ¡ximo: 100)

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

| Guard | DescripciÃ³n |
|---|---|
| `JwtAuthGuard` | Requiere `Authorization: Bearer <token>` vÃ¡lido |
| `MenuRolGuard` | Verifica que el rol del usuario tenga permiso para el mÃ©todo HTTP en esa ruta |
| `SuscripcionGuard` | Bloquea si la suscripciÃ³n del contribuyente estÃ¡ CANCELADA y sin trial vigente |
| `GoogleAuthGuard` | Maneja el flujo OAuth2 con Google (redirect + callback) |
| `ApiKeyGuard` | Requiere header `x-api-key: <API_KEY>` (solo endpoints geogrÃ¡ficos) |
| `Throttle (login)` | MÃ¡ximo 5 intentos por minuto por IP |

---

## Correcciones P0.7
| Sección | Corrección    |
|---|---|
| Credenciales | T3: bootstrap, 0 filas Email/Password |

## 1. AutenticaciÃ³n (/auth)

### POST /auth/login
Autentica un usuario y devuelve tokens JWT.  
**Guard:** Throttle 5 req/min  

**Body:**
```json
{
  "email": "<contraseÃ±a-segura>",
  "password": "<contraseÃ±a-segura>"
}
```

**Respuesta exitosa (200):**
```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "7137c9efa...",
  "user": {
    "id": 1,
    "email": "<contraseÃ±a-segura>",
    "nombre": "Admin",
    "apellido": "Sistema",
    "rol": {
      "id": 1,
      "nombre": "Administrador"
    }
  }
}
```

**Errores:** `401` credenciales invÃ¡lidas, `429` demasiados intentos.

---

### GET /auth/me
Devuelve el perfil completo del usuario autenticado.  
**Guard:** `JwtAuthGuard`

**Respuesta (200):**
```json
{
  "id": 1,
  "email": "<contraseÃ±a-segura>",
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
Rota el refresh token y devuelve nuevos tokens. El token anterior queda invÃ¡lido.  
**Guard:** PÃºblico

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

**Errores:** `401` token invÃ¡lido o ya rotado.

---

### POST /auth/logout
Revoca el refresh token activo. El access_token sigue siendo vÃ¡lido hasta expirar (8h).  
**Guard:** `JwtAuthGuard`

**Body:**
```json
{
  "refresh_token": "7137c9efaed6b48bd2800c2dedca388..."
}
```

**Respuesta (200):**
```json
{ "message": "SesiÃ³n cerrada correctamente." }
```

---

### POST /auth/register
Registra un nuevo usuario. Requiere permiso de guardar en `/usuarios`.  
**Guard:** `JwtAuthGuard` + `MenuRolGuard`

**Body (con persona nueva):**
```json
{
  "email": "contador@empresa.com",
  "password": "<contraseÃ±a-segura>",
  "rol_id": 2,
  "persona": {
    "nombre": "Carlos",
    "apellido": "GonzÃ¡lez",
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
  "password": "<contraseÃ±a-segura>",
  "rol_id": 2,
  "persona_id": 5
}
```

**Respuesta (201):** Objeto `Usuario` creado.  
**Nota:** Se envÃ­a email de bienvenida automÃ¡ticamente.

---

### POST /auth/forgot-password
EnvÃ­a un email con enlace de recuperaciÃ³n (vÃ¡lido 1 hora).  
**Guard:** PÃºblico

**Body:**
```json
{ "email": "<contraseÃ±a-segura>" }
```

**Respuesta (200):**
```json
{ "message": "Correo de recuperaciÃ³n enviado." }
```

---

### POST /auth/reset-password
Restablece la contraseÃ±a usando el token del email.  
**Guard:** PÃºblico

**Body:**
```json
{
  "token": "a3f8c2d1e4b7...",
  "nueva_password": "<contraseÃ±a-segura>"
}
```

**Respuesta (200):**
```json
{ "message": "ContraseÃ±a actualizada correctamente." }
```

---

### POST /auth/cambiar-password
Cambia la contraseÃ±a del usuario autenticado, requiriendo la contraseÃ±a actual.  
**Guard:** `JwtAuthGuard`

**Body:**
```json
{
  "password_actual": "<contraseÃ±a-segura>",
  "nueva_password": "<contraseÃ±a-segura>"
}
```

**Respuesta (200):**
```json
{ "message": "ContraseÃ±a actualizada correctamente." }
```

---

### GET /auth/google
Inicia el flujo de autenticaciÃ³n con Google. Passport redirige automÃ¡ticamente al selector de cuenta de Google.  
**Guard:** `GoogleAuthGuard` (pÃºblico)

> No requiere body ni headers. El usuario es redirigido al login de Google.  
> Pendiente: completar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`.

---

### GET /auth/google/callback
Callback al que redirige Google tras la autenticaciÃ³n exitosa. No se llama directamente â€” Google lo invoca automÃ¡ticamente.
**Guard:** GoogleAuthGuard`n
> ⚠️ **Corregido P0.7** C2: P1a.8a: OAuth no debe auto-crear; el código actual todavía auto-crea (`findOrCreateGoogleUser`). C3: P1a.8b comportamiento actual inseguro.

**Comportamiento:**
- Si el email de Google ya existe en la BD â†’ retorna el usuario existente
- Si no existe â†’ crea persona (sin documento de identidad) + usuario con rol Contador (id=2) y password aleatorio
- Redirige al frontend con los tokens como query params:

```
GET {GOOGLE_REDIRECT_FRONTEND_URL}/auth/google/callback
    ?access_token=eyJhbGci...
    &refresh_token=f73b0cc2...
```

**El frontend recibe los tokens y los almacena igual que en el login normal.**

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
  "direccion": "Av. Mariscal LÃ³pez 1234, AsunciÃ³n",
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

| Campo | Tipo | Requerido | DescripciÃ³n |
|---|---|---|---|
| `nombre` | string | âœ… | Nombre de la persona |
| `apellido` | string | âœ… | Apellido |
| `telefono` | string | âŒ | TelÃ©fono de contacto |
| `direccion` | string | âŒ | DirecciÃ³n |
| `ciudad_id` | number | âŒ | ID de ciudad |
| `documentos` | array | âœ… | Al menos 1 documento |
| `documentos[].tipo_documento_id` | number | âœ… | ID del tipo de documento |
| `documentos[].numero` | string | âœ… | NÃºmero del documento |
| `documentos[].fecha_vencimiento` | date | âŒ | Vencimiento (YYYY-MM-DD) |

**Respuesta (201):** Objeto `Persona` con sus documentos.

---

### GET /personas
Lista personas con paginaciÃ³n.

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
  "password": "<contraseÃ±a-segura>",
  "rol_id": 2,
  "persona": {
    "nombre": "MarÃ­a",
    "apellido": "LÃ³pez",
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
  "password": "<contraseÃ±a-segura>",
  "rol_id": 2,
  "persona_id": 7
}
```

| Campo | Tipo | Requerido | DescripciÃ³n |
|---|---|---|---|
| `email` | string | âœ… | Email Ãºnico |
| `password` | string | âœ… | ContraseÃ±a en texto plano (se hashea con bcrypt) |
| `rol_id` | number | âœ… | ID del rol (1=Admin, 2=Contador, 3=Solo Lectura) |
| `persona_id` | number | âŒ | ID de persona existente |
| `persona` | object | âŒ | Datos para crear persona nueva (si no hay `persona_id`) |

**Nota:** Se debe enviar `persona_id` O `persona`, no ambos.

---

### GET /usuarios
Lista usuarios con paginaciÃ³n.

**Query params:** `?page=1&limit=20`

---

### GET /usuarios/:id
Obtiene un usuario por ID.

---

### PATCH /usuarios/:id
Actualiza un usuario. Si se envÃ­a `password`, se hashea automÃ¡ticamente.

**Body:**
```json
{
  "password": "<contraseÃ±a-segura>",
  "rol_id": 3
}
```

---

### DELETE /usuarios/:id
Elimina un usuario.

---

## 4. Persona Documentos (`/persona-documentos`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/persona-documentos`)

CRUD estÃ¡ndar para gestionar documentos de identidad de personas en forma independiente.

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
**Soft delete:** Los registros eliminados no se borran fÃ­sicamente (campo `deleted_at`).

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

| Campo | Tipo | Requerido | Valores vÃ¡lidos |
|---|---|---|---|
| `persona_id` | number | âœ… | ID de persona existente |
| `ruc` | string | âœ… | RUC sin dÃ­gito verificador (mÃ¡x 20 chars) |
| `dv` | number | âœ… | DÃ­gito verificador |
| `razon_social` | string | âœ… | Nombre legal (mÃ¡x 255 chars) |
| `tipo_impuesto` | enum | âœ… | `IVA`, `IVA_IRE`, `IVA_IRP`, `IVA_IRE_IRP` |

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
**Soft delete activo.** Los POST ademÃ¡s tienen `SuscripcionGuard`.

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

| Campo | Tipo | Requerido | DescripciÃ³n |
|---|---|---|---|
| `contribuyente_id` | number | âœ… | ID del contribuyente propietario |
| `nro_comprobante` | string | âœ… | Formato exacto: `###-###-#######` |
| `timbrado` | string | âœ… | 8 dÃ­gitos exactos |
| `ruc_emisor` | string | âœ… | RUC del emisor (con o sin DV) |
| `razon_social_emisor` | string | âœ… | Nombre del emisor |
| `fecha_emision` | date | âœ… | Formato `YYYY-MM-DD` |
| `monto_total` | number | âœ… | Total en guaranÃ­es (mÃ­nimo: 1) |
| `gravada_10` | number | âŒ | Base gravada al 10% |
| `gravada_5` | number | âŒ | Base gravada al 5% |
| `exenta` | number | âŒ | Monto exento |
| `iva_10` | number | âŒ | IVA al 10% |
| `iva_5` | number | âŒ | IVA al 5% |
| `tipo_comprobante_set` | number | âŒ | CÃ³digo SET: 101-112, 201-211 |
| `condicion_operacion` | number | âŒ | `1`=contado, `2`=crÃ©dito |
| `imputa_iva` | string | âŒ | `"S"` o `"N"` |
| `imputa_ire` | string | âŒ | `"S"` o `"N"` |
| `imputa_irp` | string | âŒ | `"S"` o `"N"` |
| `no_imputa` | string | âŒ | `"S"` o `"N"` |
| `moneda_extranjera` | string | âŒ | `"S"` o `"N"` |
| `tipo_gasto` | enum | âŒ | ClasificaciÃ³n IRP gasto |
| `comprobante_asociado` | string | âŒ | Para notas crÃ©dito/dÃ©bito: `###-###-#######` |
| `timbrado_asociado` | string | âŒ | Timbrado del comprobante original |

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
> ⚠️ **Corregido P0.7** C7: Endpoints de bolsa de revisión.
Lista comprobantes en estado `REQUIERE_REVISION` aÃºn sin contador asignado (revisiÃ³n pendiente).

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
Un contador reclama un comprobante para su revisiÃ³n. Protege contra doble reclamo concurrente.

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

| Campo | Tipo | Requerido | DescripciÃ³n |
|---|---|---|---|
| `contribuyente_id` | number | âœ… | ID del contribuyente emisor |
| `nro_comprobante` | string | âœ… | Formato `###-###-#######` |
| `timbrado` | string | âœ… | 8 dÃ­gitos |
| `fecha_emision` | date | âœ… | `YYYY-MM-DD` |
| `ruc_cliente` | string | âœ… | RUC del cliente comprador |
| `razon_social_cliente` | string | âœ… | Nombre del cliente |
| `monto_total` | number | âœ… | Total en guaranÃ­es |
| `gravada_10` | number | âŒ | Base gravada al 10% |
| `gravada_5` | number | âŒ | Base gravada al 5% |
| `exenta` | number | âŒ | Monto exento |
| `iva_10` | number | âŒ | IVA calculado 10% |
| `iva_5` | number | âŒ | IVA calculado 5% |
| `tipo_comprobante_set` | number | âŒ | CÃ³digo SET (101-211) |
| `condicion_operacion` | number | âŒ | `1`=contado, `2`=crÃ©dito |
| `moneda_extranjera` | string | âŒ | `"S"` o `"N"` |
| `imputa_iva` | string | âŒ | `"S"` o `"N"` |
| `imputa_ire` | string | âŒ | `"S"` o `"N"` |
| `imputa_irp` | string | âŒ | `"S"` o `"N"` |

---

### GET /negocio/comprobantes-ventas
**Query params:** `?page=1&limit=20&contribuyente_id=1`

### GET /negocio/comprobantes-ventas/:id
### PATCH /negocio/comprobantes-ventas/:id
### DELETE /negocio/comprobantes-ventas/:id

### GET /negocio/comprobantes-ventas/bolsa/pendientes
### POST /negocio/comprobantes-ventas/bolsa/:id/reclamar
(Misma lÃ³gica que compras.)

---

## 8. OCR â€” ExtracciÃ³n AutomÃ¡tica (`/ocr-tax`)

**Guard:** `JwtAuthGuard` + `MenuRolGuard` (permiso `/ocr-tax`) + capa 2 (asignaciÃ³n) + capa 3 (suscripciÃ³n)  
**Content-Type:** `multipart/form-data`

### Pipeline de procesamiento
1. Verifica JWT y permisos del rol
2. Verifica que el usuario tenga asignaciÃ³n contable para el RUC enviado
3. Verifica que el contribuyente tenga suscripciÃ³n activa o trial vigente
4. Valida el archivo (JPEG/PNG/WebP, mÃ¡x 5 MB)
5. Convierte imagen a WebP con sharp y sube a Cloudflare R2
6. Procesa con Tesseract.js (primario)
7. Si confianza < 75% o faltan campos â†’ fallback a Google Vision
8. Extrae y valida datos fiscales (cuadratura matemÃ¡tica, formato timbrado)
9. Consulta SET RUC para razÃ³n social y estado
10. Guarda en comprobantes + cÃ¡psula de entrenamiento OCR
11. Devuelve `AUTO_PROCESADO` o `REQUIERE_REVISION`

---

### POST /ocr-tax/extraer/compra
Procesa una imagen de factura de compra (gasto del contribuyente).

**Form-data:**
| Campo | Tipo | Requerido |
|---|---|---|
| `imagen` | File | âœ… JPG/PNG/WebP, mÃ¡x 5MB |
| `ruc` | string | âœ… RUC del contribuyente (ej: `80123456` o `80123456-7`) |

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
- `400` archivo vacÃ­o, MIME no permitido, o imagen no reconocida como comprobante
- `403` sin asignaciÃ³n contable para ese RUC
- `403` suscripciÃ³n CANCELADA sin trial vigente

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
| Param | Tipo | Requerido | DescripciÃ³n |
|---|---|---|---|
| `contribuyente_id` | number | âœ… | ID del contribuyente |
| `anio` | number | âœ… | AÃ±o (ej: `2026`) |
| `mes` | number | âŒ | Mes 1-12 (si no se envÃ­a, exporta todo el aÃ±o) |

**Ejemplo:**
```
GET /negocio/exportaciones/rg90/compras?contribuyente_id=1&anio=2026&mes=6
```

**Respuesta:** Descarga del archivo `RG90_COMPRAS_2026_6.csv`

---

### GET /negocio/exportaciones/rg90/ventas
Mismos parÃ¡metros que compras.

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

**Errores:** `409` si la asignaciÃ³n ya existe.

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

**Body (suscripciÃ³n normal):**
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

| Campo | Tipo | Requerido | Valores / DescripciÃ³n |
|---|---|---|---|
| `contribuyente_id` | number | âœ… | ID del contribuyente |
| `estado` | enum | âŒ | `ACTIVO`, `MOROSO`, `CANCELADO` (default: `ACTIVO`) |
| `fecha_inicio` | date | âœ… | Fecha de inicio `YYYY-MM-DD` |
| `es_trial` | boolean | âŒ | Si es perÃ­odo de prueba gratuito |
| `trial_hasta` | date | âŒ | Fecha lÃ­mite del trial `YYYY-MM-DD` |

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

Registra los pagos de cuotas asociados a una suscripciÃ³n.

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

| Campo | Tipo | Requerido | DescripciÃ³n |
|---|---|---|---|
| `suscripcion_id` | number | âœ… | ID de la suscripciÃ³n |
| `monto` | number | âœ… | Monto en guaranÃ­es |
| `fecha_vencimiento` | date | âœ… | `YYYY-MM-DD` |
| `fecha_pago` | date | âŒ | `YYYY-MM-DD` (nulo si no pagado) |
| `estado` | enum | âŒ | `PENDIENTE`, `PAGADO`, `VENCIDO` |

---

### GET /cobranzas/cuotas-pagos
**Query params:** `?page=1&limit=20&suscripcion_id=1`

### GET /cobranzas/cuotas-pagos/:id
### PATCH /cobranzas/cuotas-pagos/:id
### DELETE /cobranzas/cuotas-pagos/:id

---

## 13. Roles (`/roles`)

**Guard:** `JwtAuthGuard` (sin MenuRolGuard â€” configuraciÃ³n del sistema)

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
Devuelve los grupos de menÃº y sus permisos configurados para ese rol. Ãštil para que el frontend construya el menÃº dinÃ¡mico.

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

## 14. MenÃºs (`/menu`)

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

## 15. Grupos de MenÃº (`/grupo-menu`)

**Guard:** `JwtAuthGuard`

### POST /grupo-menu
```json
{
  "nombre": "AdministraciÃ³n",
  "descripcion": "MÃ³dulos de configuraciÃ³n del sistema",
  "icono": "settings"
}
```

### GET /grupo-menu
### GET /grupo-menu/:id
### PATCH /grupo-menu/:id
### DELETE /grupo-menu/:id

---

## 16. Permisos MenÃº-Rol (`/menu-rol`)

**Guard:** `JwtAuthGuard`

Asigna permisos granulares (listar/guardar/editar/eliminar) a un rol para un menÃº especÃ­fico.

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

| Campo | Tipo | DescripciÃ³n |
|---|---|---|
| `menu_id` | number | ID del menÃº |
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
  "nombre": "CÃ©dula de Identidad",
  "codigo": "CI"
}
```

### GET /tipos-documento
### GET /tipos-documento/:id
### PATCH /tipos-documento/:id
### DELETE /tipos-documento/:id

---

## 18. PaÃ­ses (`/pais`)

**Guard:** `JwtAuthGuard`

### POST /pais
```json
{ "nombre": "Paraguay" }
```

### POST /pais/masivo
Carga masiva de paÃ­ses.
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

**Guard:** `ApiKeyGuard` â€” Requiere header `x-api-key: <API_KEY>`

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
  { "nombre": "Alto ParanÃ¡", "pais_id": 1 }
]
```

### GET /departamento
**Query params:** `?nombre=Central`

### GET /departamento/:id
### PATCH /departamento/:id
### DELETE /departamento/:id

---

## 20. Ciudades (`/ciudad`)

**Guard:** `ApiKeyGuard` â€” Requiere header `x-api-key: <API_KEY>`

### POST /ciudad
```json
{
  "nombre": "AsunciÃ³n",
  "departamento_id": 1
}
```

### POST /ciudad/masivo
```json
[
  { "nombre": "AsunciÃ³n", "departamento_id": 1 },
  { "nombre": "San Lorenzo", "departamento_id": 1 }
]
```

### GET /ciudad
**Query params:** `?nombre=AsunciÃ³n`

### GET /ciudad/:id
### PATCH /ciudad/:id
### DELETE /ciudad/:id

---

## CÃ³digos de tipo de comprobante SET

| CÃ³digo | DescripciÃ³n |
|---|---|
| 101 | Factura |
| 102 | Nota de dÃ©bito |
| 103 | Nota de crÃ©dito |
| 104 | Autofactura |
| 105 | Nota de remisiÃ³n |
| 106 | Comprobante de retenciÃ³n |
| 107 | Comprobante de liquidaciÃ³n |
| 108 | LiquidaciÃ³n de compra a pequeÃ±o productor |
| 109 | Ticket (POS) |
| 110 | Entrada de dinero |
| 111 | Salida de dinero |
| 112 | Nota de venta |
| 201 | Factura electrÃ³nica (E-Factura) |
| 202 | Nota de dÃ©bito electrÃ³nica |
| 203 | Nota de crÃ©dito electrÃ³nica |
| 204 | Autofactura electrÃ³nica |
| 205 | Nota de remisiÃ³n electrÃ³nica |
| 206 | Comprobante de retenciÃ³n electrÃ³nico |
| 207 | Comprobante de liquidaciÃ³n electrÃ³nico |
| 208 | LiquidaciÃ³n de compra a pequeÃ±o productor electrÃ³nica |
| 209 | Ticket electrÃ³nico |
| 210 | Entrada de dinero electrÃ³nica |
| 211 | Salida de dinero electrÃ³nica |

---

## Roles del sistema

| ID | Nombre | Acceso |
|---|---|---|
| 1 | Administrador | LGED (Listar, Guardar, Editar, Eliminar) en todo |
| 2 | Contador | Acceso operativo (comprobantes, OCR, exportaciones) |
| 3 | Solo Lectura | Solo consulta, sin crear/editar/eliminar |

---

## Credenciales de prueba

> ⚠️ **Corregido P0.7** Usar  `npm run bootstrap:admin`.