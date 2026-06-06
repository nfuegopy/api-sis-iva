# Google OAuth2 — Guía de configuración completa

## ¿Qué hace este módulo?

Permite que un usuario inicie sesión o se registre en el sistema usando su cuenta de Google, sin necesidad de crear un email/password manualmente. Al finalizar, el sistema devuelve los mismos `access_token` y `refresh_token` que el login normal — el resto de la API funciona igual.

---

## Archivos que participan en el flujo

```
src/auth/
├── strategies/google.strategy.ts     ← Valida el perfil Google, llama findOrCreateGoogleUser()
├── guards/google-auth.guard.ts       ← Wrapper de AuthGuard('google') para los endpoints
├── auth.controller.ts                ← Define GET /auth/google y GET /auth/google/callback
└── auth.module.ts                    ← Registra GoogleStrategy como provider

src/gestion/usuarios/
└── usuarios.service.ts               ← Método findOrCreateGoogleUser() — crea usuario si no existe
```

### Qué hace cada archivo

**`google.strategy.ts`**
- Le indica a Passport los parámetros de OAuth (Client ID, Secret, Callback URL)
- Recibe el perfil del usuario desde Google (nombre, apellido, email)
- Llama a `findOrCreateGoogleUser()` para buscar o crear el usuario en la BD
- Devuelve el usuario completo con relaciones (`persona`, `rol`) cargadas

**`google-auth.guard.ts`**
- Guard reutilizable que activa la estrategia Google en los dos endpoints
- En `GET /auth/google`: inicia el redirect a Google
- En `GET /auth/google/callback`: procesa la respuesta de Google

**`auth.controller.ts` — los dos endpoints nuevos**
```
GET /auth/google
  → Passport redirige automáticamente al login de Google
  → No requiere body ni headers

GET /auth/google/callback
  → Google llama este endpoint al terminar la autenticación
  → La API genera los JWT tokens
  → Redirige al frontend con los tokens como query params:
     {GOOGLE_REDIRECT_FRONTEND_URL}/auth/google/callback?access_token=...&refresh_token=...
```

**`usuarios.service.ts` — método `findOrCreateGoogleUser()`**
- Busca en la tabla `usuarios` por el email de Google
- Si existe → retorna el usuario existente (con relaciones)
- Si no existe →
  1. Crea una `persona` con nombre y apellido (sin documentos de identidad)
  2. Crea el `usuario` con:
     - `rol_id = 2` (Contador — cambiar si se necesita otro rol por defecto)
     - `password` = bcrypt de 64 bytes aleatorios (nunca se usa para login)
     - `es_temporal = false`

---

## Flujo paso a paso

```
1. Frontend abre (redirect o popup):
   GET https://api-qa.acbldeveloper.com/auth/google

2. Passport detecta el guard y redirige automáticamente a:
   https://accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...

3. Usuario elige su cuenta Google y autoriza la app

4. Google redirige a la API:
   GET https://api-qa.acbldeveloper.com/auth/google/callback?code=4/...

5. GoogleStrategy.validate() recibe el perfil de Google:
   {
     emails: [{ value: "usuario@gmail.com" }],
     name: { givenName: "Juan", familyName: "García" }
   }

6. findOrCreateGoogleUser() busca/crea el usuario en MySQL

7. authService.login(user) genera los JWT tokens

8. La API redirige al frontend:
   https://mifrontend.com/auth/google/callback
     ?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     &refresh_token=f73b0cc2272aeca77332d05113184223...

9. El frontend lee los params, guarda los tokens y redirige al dashboard
```

---

## Lo que hay que configurar en Google Cloud Console

### Paso 1 — Crear o seleccionar un proyecto

1. Ir a [https://console.cloud.google.com](https://console.cloud.google.com)
2. En el selector de proyectos (arriba izquierda) → **New Project**
3. Nombre: `Facturacion IVA` (o el que prefieras)
4. Click en **Create**

---

### Paso 2 — Habilitar las APIs necesarias

1. Menú izquierdo → **APIs & Services** → **Library**
2. Buscar **"Google+ API"** → Click → **Enable**
3. Buscar **"People API"** → Click → **Enable**

---

### Paso 3 — Configurar la pantalla de consentimiento OAuth

1. Menú izquierdo → **APIs & Services** → **OAuth consent screen**
2. User Type: **External** → **Create**
3. Completar:
   - **App name**: `Facturación IVA`
   - **User support email**: tu email
   - **Developer contact information**: tu email
4. Click **Save and Continue**
5. En **Scopes**: click **Add or Remove Scopes**
   - Marcar `../auth/userinfo.email`
   - Marcar `../auth/userinfo.profile`
   - **Update** → **Save and Continue**
6. En **Test users** (mientras la app está en modo Testing):
   - Agregar los emails que van a probar el login
   - **Save and Continue**

> ⚠️ En modo Testing solo pueden loguearse los emails que agregues aquí.
> Para producción hay que solicitar verificación de la app a Google.

---

### Paso 4 — Crear las credenciales OAuth 2.0

1. Menú izquierdo → **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `Facturacion IVA API`
5. **Authorized JavaScript origins** — agregar:
   ```
   http://localhost:9031
   https://api-qa.acbldeveloper.com
   ```
6. **Authorized redirect URIs** — agregar AMBAS:
   ```
   http://localhost:9031/auth/google/callback
   https://api-qa.acbldeveloper.com/auth/google/callback
   ```
7. Click **Create**

8. Se abre un modal con las credenciales:
   - Copiar **Client ID** → va a `GOOGLE_CLIENT_ID` en el `.env`
   - Copiar **Client Secret** → va a `GOOGLE_CLIENT_SECRET` en el `.env`

---

## Variables de entorno a completar en `.env`

Las siguientes 4 variables ya están en el `.env` del proyecto, solo hay que llenarlas:

```env
# ==========================================
# GOOGLE OAUTH2
# ==========================================
GOOGLE_CLIENT_ID=         ← pegar el Client ID del paso 4
GOOGLE_CLIENT_SECRET=     ← pegar el Client Secret del paso 4
GOOGLE_CALLBACK_URL=https://api-qa.acbldeveloper.com/auth/google/callback
GOOGLE_REDIRECT_FRONTEND_URL=http://localhost:3000
```

### Descripción de cada variable

| Variable | Qué es | Ejemplo |
|---|---|---|
| `GOOGLE_CLIENT_ID` | ID público de la app en Google Cloud | `1234567890-abc123.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Clave secreta de la app (no compartir) | `GOCSPX-abcdef123456` |
| `GOOGLE_CALLBACK_URL` | URL de la API donde Google redirige tras el login. Debe coincidir exactamente con la registrada en Google Cloud | `https://api-qa.acbldeveloper.com/auth/google/callback` |
| `GOOGLE_REDIRECT_FRONTEND_URL` | URL base del frontend. La API redirige aquí con los tokens tras el callback | `https://mifrontend.com` o `http://localhost:3000` |

> **IMPORTANTE:** `GOOGLE_CALLBACK_URL` debe ser exactamente igual a una de las URIs autorizadas registradas en Google Cloud Console. Si difieren en un solo carácter, Google rechaza el callback con `redirect_uri_mismatch`.

---

## Cómo probarlo una vez configurado

### Prueba rápida desde el navegador

1. Levantar la API: `npm run start:dev`
2. Abrir en el navegador:
   ```
   http://localhost:9031/auth/google
   ```
3. Aparece el selector de cuenta de Google
4. Elegir una cuenta que esté en la lista de "Test users" (Paso 3)
5. El navegador redirige a:
   ```
   http://localhost:3000/auth/google/callback?access_token=eyJ...&refresh_token=abc...
   ```
   (la página puede dar 404 si el frontend no está corriendo — lo importante es que los tokens aparezcan en la URL)

### Verificar que el usuario se creó en la BD

```sql
SELECT id, email, rol_id, es_temporal, LEFT(password, 10) AS inicio_hash
FROM usuarios
ORDER BY id DESC
LIMIT 5;
```

El usuario Google aparece con:
- `rol_id = 2` (Contador)
- `es_temporal = false`
- `password` comenzando con `$2b$10$` (hash bcrypt — nunca fue plain text)

### Usar el token recibido

Copiar el `access_token` de la URL y usarlo como Bearer token en cualquier endpoint:

```bash
curl http://localhost:9031/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Integración en el frontend

### Opción A — Redirect completo (más simple)

```javascript
// Botón "Iniciar sesión con Google"
function loginConGoogle() {
  window.location.href = 'https://api-qa.acbldeveloper.com/auth/google';
}

// Página /auth/google/callback del frontend
function procesarCallbackGoogle() {
  const params = new URLSearchParams(window.location.search);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (access_token) {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    window.location.href = '/dashboard';
  } else {
    // Error en el login
    window.location.href = '/login?error=google_failed';
  }
}
```

### Opción B — Popup (sin perder la página actual)

```javascript
function loginConGooglePopup() {
  const popup = window.open(
    'https://api-qa.acbldeveloper.com/auth/google',
    'google-oauth',
    'width=500,height=650,left=200,top=100'
  );

  // El frontend en /auth/google/callback debe enviar un postMessage:
  // window.opener.postMessage({ access_token, refresh_token }, '*');
  // popup.close();

  window.addEventListener('message', (event) => {
    const { access_token, refresh_token } = event.data;
    if (access_token) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      // Actualizar estado de la app sin recargar
    }
  });
}
```

---

## Consideraciones importantes

| Aspecto | Detalle |
|---|---|
| **Rol por defecto** | Contador (id=2). Para cambiarlo editar `rol_id: 2` en `usuarios.service.ts` → `findOrCreateGoogleUser()` |
| **Usuarios existentes** | Si el email de Google ya existe en la BD (creado previamente por admin), el sistema retorna ese usuario sin crear uno nuevo |
| **Sin documento de identidad** | Los usuarios Google se crean sin cédula. Si es necesario, el admin puede agregarlo después desde `/persona-documentos` |
| **Password** | Se genera un hash bcrypt de bytes aleatorios. El usuario no lo conoce y no puede hacer login por contraseña (solo por Google). El admin puede asignar una contraseña con `PATCH /usuarios/:id` si fuera necesario |
| **Modo Testing de Google** | Mientras la app esté en "Testing" en Google Cloud, solo los emails agregados como "Test users" pueden autenticarse |
| **Producción** | Para que cualquier cuenta de Google pueda usarlo, hay que solicitar la verificación de la app en Google Cloud (OAuth consent screen → Publish App) |
| **HTTPS obligatorio** | En producción Google requiere HTTPS para el `GOOGLE_CALLBACK_URL`. El entorno QA (`api-qa.acbldeveloper.com`) ya tiene HTTPS |
