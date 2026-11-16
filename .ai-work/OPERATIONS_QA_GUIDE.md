# Guía Limpia de Instalación Local, Configuración, Migración y Recorrido QA (`OPERATIONS_QA_GUIDE`)

> Guía redactada y revisada documentalmente. **No ejecutada.** No afirma que el producto implemente multiempresa, modos, D6 completo, OCR ni RG90 corregidos. Los documentos de `.ai-work` no están versionados ni publicados.

Fecha: 2026-10-31.
Entorno objetivo de esta guía: **exclusivamente local (`127.0.0.1` / `localhost`)** sobre una base de datos temporal aislada (`<bd_temporal_qa_local>`), utilizando **PowerShell 5.1**. Prohibido apuntar a servidores remotos, entornos de QA o producción, y prohibido escribir contraseñas o secretos literales en línea de comando o archivos de documentación.

---

## 1. Precondiciones y versiones

1. **Node.js y npm**:
   - Ni `Facturacion-IVA/package.json` ni `sis-iva-frontend/package.json` definen el campo `engines` (la versión de Node.js no está fijada en los repositorios).
   - Antes de iniciar una prueba local, registrar la versión exacta de `node` y `npm` utilizada en la sesión.
2. **PHP y Composer (BFF Laravel)**:
   - **Requisitos declarados en `sis-iva-frontend/composer.json`**: **PHP `^8.2`** y **`laravel/framework: ^12.0`** (`composer.json` no declara versión de Composer ni extensiones `ext-*`).
   - **Requisitos recomendados para operación local**: **Composer 2.x**; extensión `pdo_mysql` para la conexión `mysql` de `.env.example`; extensión `pdo_sqlite` si se usa `sqlite` o para ejecutar los tests (por verificar en el entorno).
3. **Motor de base de datos local**:
   - **MySQL 8.x local**: motor histórico probado sobre el cual se generó el snapshot `database/baseline/0000-current-schema-mysql8.sql` (`utf8mb4_unicode_ci`).
   - **MariaDB 11.8.x local**: motor objetivo definido en **D23** para paridad con QA y producción. **Advertencia**: el runtime local sobre MariaDB 11.8.x aún **no está validado** y el baseline histórico de MySQL 8 no certifica el motor objetivo.
4. **Comandos de verificación de versiones (PowerShell 5.1)**:

```powershell
$PSVersionTable.PSVersion
node --version
npm --version
php --version
composer --version
mysql --version
```

*(Si se dispone del cliente de MariaDB localmente, verificar con `mariadb --version`).*

---

## 2. Variables de entorno

En todos los casos se documentan **únicamente nombres de variables y placeholders**. Nunca copiar valores reales ni contraseñas en archivos Markdown.

### 2.1 Variables de la API en runtime (`Facturacion-IVA/src/`)

Relevadas directamente del código fuente (`process.env.*` y `configService.get*`):

| Variable | Placeholder | Origen en código | Obligatoria / Opcional (según código) |
|---|---|---|---|
| `DB_HOST` | `127.0.0.1` | `src/app.module.ts:50` (`process.env.DB_HOST`) | Por verificar en arranque (requerida para conectar a BD; **sin allowlist local en `AppModule`**) |
| `DB_PORT` | `3306` | `src/app.module.ts:51` (`parseInt(process.env.DB_PORT \|\| '3306', 10)`) | Opcional en código (default `3306`) |
| `DB_USERNAME` | `<usuario-bd-local>` | `src/app.module.ts:52` (`process.env.DB_USERNAME`) | Por verificar en arranque (requerida por el motor SQL local) |
| `DB_PASSWORD` | `<password-bd-local>` | `src/app.module.ts:53` (`process.env.DB_PASSWORD`) | Por verificar en arranque (requerida por el motor SQL local) |
| `DB_DATABASE` | `<bd_temporal_qa_local>` | `src/app.module.ts:54` (`process.env.DB_DATABASE`) | Por verificar en arranque (requerida para seleccionar la BD temporal local) |
| `PORT` | `9031` | `src/main.ts:32` (`process.env.PORT \|\| 9031`) | Opcional en código (default `9031`) |
| `CORS_ORIGIN` | `http://localhost:8000` | `src/main.ts:13` (`process.env.CORS_ORIGIN`) | Opcional en código (fallback `['http://localhost:3000', 'http://localhost:4200']`) |
| `JWT_SECRET` | `<jwt-secret-local>` | `src/auth/strategies/jwt.strategy.ts:17` (`getOrThrow('JWT_SECRET')`) y `src/auth/auth.module.ts:38` | **Obligatoria** (demostrado por `configService.getOrThrow`: la API falla al iniciar si falta) |
| `JWT_EXPIRATION` | `<jwt-expiration>` | `src/auth/auth.module.ts:40` (`configService.get('JWT_EXPIRATION')`) | Por verificar (leída al registrar `JwtModule`) |
| `API_KEY` | `<api-key-local>` | `src/common/guards/api-key.guard.ts:24` (`configService.get('API_KEY')?.trim()`) | **Obligatoria para rutas con `ApiKeyGuard`** (`/departamento`, `/ciudad`): *fail-closed* (P0.3; si falta o está vacía devuelve `401 Unauthorized`) |
| `GOOGLE_CLIENT_ID` | `<no-configurar>` | `src/auth/config/google-oauth.config.ts:12` | **Opcional en arranque (P0.1)**. Por decisión **D2 / P1a.8d: NO configurar en esta etapa** |
| `GOOGLE_CLIENT_SECRET` | `<no-configurar>` | `src/auth/config/google-oauth.config.ts:13` | **Opcional en arranque (P0.1)**. Por decisión **D2 / P1a.8d: NO configurar en esta etapa** |
| `GOOGLE_CALLBACK_URL` | `<no-configurar>` | `src/auth/config/google-oauth.config.ts:16` | **Opcional en arranque (P0.1)**. Por decisión **D2 / P1a.8d: NO configurar en esta etapa** |
| `GOOGLE_REDIRECT_FRONTEND_URL` | `<no-configurar>` | `src/auth/auth.controller.ts:137` | **Opcional** (tiene fallback en controlador; **no usar Google OAuth en esta etapa**, D2) |
| `R2_ENDPOINT` | `<r2-endpoint-placeholder>` | `src/negocio/ocr-tax/services/image-optimization/image-optimization.service.ts:18` | Por verificar (usada en `ImageOptimizationService`; flujo OCR/R2 bloqueado por P1d y D10) |
| `R2_ACCESS_KEY` | `<r2-access-key-placeholder>` | `src/negocio/ocr-tax/services/image-optimization/image-optimization.service.ts:20` | Por verificar (bloqueado por P1d y D10) |
| `R2_SECRET_KEY` | `<r2-secret-key-placeholder>` | `src/negocio/ocr-tax/services/image-optimization/image-optimization.service.ts:21` | Por verificar (bloqueado por P1d y D10) |
| `R2_BUCKET_NAME` | `<r2-bucket-placeholder>` | `src/negocio/ocr-tax/services/image-optimization/image-optimization.service.ts:48` | Por verificar (bloqueado por P1d y D10) |
| `R2_PUBLIC_URL` | `<r2-public-url-placeholder>` | `src/negocio/ocr-tax/services/image-optimization/image-optimization.service.ts:55` | Por verificar (bloqueado por P1d y D10) |
| `MAIL_HOST` | `<mail-host-placeholder>` | `src/common/notifications/notifications.module.ts:22` | Por verificar (leída en `MailerModule.forRootAsync`) |
| `MAIL_PORT` | `<mail-port-placeholder>` | `src/common/notifications/notifications.module.ts:23` | Por verificar |
| `MAIL_SECURE` | `false` | `src/common/notifications/notifications.module.ts:24` | Opcional en código (`=== 'true'`) |
| `MAIL_USER` | `<mail-user-placeholder>` | `src/common/notifications/notifications.module.ts:26` | Por verificar |
| `MAIL_PASS` | `<mail-pass-placeholder>` | `src/common/notifications/notifications.module.ts:27` | Por verificar |
| `MAIL_FROM` | `<mail-from-placeholder>` | `src/common/notifications/notifications.module.ts:34` | Por verificar |
| `MAIL_IGNORE_TLS` | `false` | `src/common/notifications/notifications.module.ts:18` | Opcional en código (`=== 'true'`) |

### 2.2 Variables del CLI de Migraciones (`src/database/data-source.ts`)

| Variable | Placeholder | Origen en código | Obligatoria / Regla |
|---|---|---|---|
| `MIGRATION_DB_HOST` | `127.0.0.1` | `src/database/data-source.ts:9,17,48` | **Obligatoria**, sin fallback a `DB_*`. Allowlist exclusiva: `localhost`, `127.0.0.1`, `::1`. Bloquea hosts y BD de QA. |
| `MIGRATION_DB_PORT` | `3306` | `src/database/data-source.ts:10,17,57` | **Obligatoria**, sin fallback a `DB_*`. |
| `MIGRATION_DB_USERNAME` | `<usuario-bd-local>` | `src/database/data-source.ts:11,17,58` | **Obligatoria**, sin fallback a `DB_*`. |
| `MIGRATION_DB_PASSWORD` | `<password-bd-local>` | `src/database/data-source.ts:12,17,59` | **Obligatoria**, sin fallback a `DB_*`. |
| `MIGRATION_DB_DATABASE` | `<bd_temporal_qa_local>` | `src/database/data-source.ts:13,17,60` | **Obligatoria**, sin fallback a `DB_*`. Bloquea explícitamente la BD de QA. |

### 2.3 Variables de Seed y Bootstrap (`src/database/seeds/seed-connection.ts` y `bootstrap-admin.config.ts`)

| Variable | Placeholder | Origen en código | Obligatoria / Regla |
|---|---|---|---|
| `SEED_DB_HOST` | `127.0.0.1` | `src/database/seeds/seed-connection.ts:9,17,45` | **Obligatoria**, sin fallback a `DB_*`. Allowlist exclusiva: `localhost`, `127.0.0.1`, `::1`. |
| `SEED_DB_PORT` | `3306` | `src/database/seeds/seed-connection.ts:10,17,54` | **Obligatoria**, sin fallback a `DB_*`. |
| `SEED_DB_USERNAME` | `<usuario-bd-local>` | `src/database/seeds/seed-connection.ts:11,17,55` | **Obligatoria**, sin fallback a `DB_*`. |
| `SEED_DB_PASSWORD` | `<password-bd-local>` | `src/database/seeds/seed-connection.ts:12,17,56` | **Obligatoria**, sin fallback a `DB_*`. |
| `SEED_DB_DATABASE` | `<bd_temporal_qa_local>` | `src/database/seeds/seed-connection.ts:13,17,57` | **Obligatoria**, sin fallback a `DB_*`. Bloquea explícitamente la BD de QA. |
| `BOOTSTRAP_ADMIN_EMAIL` | `<email-admin-plataforma>` | `src/database/seeds/bootstrap-admin.config.ts:20,40` | **Obligatoria** en `bootstrap:admin`; se normaliza con `trim().toLowerCase()` y valida formato email. |
| `BOOTSTRAP_ADMIN_PASSWORD` | `<password-admin-min-12>` | `src/database/seeds/bootstrap-admin.config.ts:23,54` | **Obligatoria** en `bootstrap:admin`; **mínimo 12 caracteres**, sin `trim`. |
| `BOOTSTRAP_ADMIN_NOMBRE` | `<nombre-admin>` | `src/database/seeds/bootstrap-admin.config.ts:26,42` | **Obligatoria** en `bootstrap:admin`; no vacía tras `trim`. |
| `BOOTSTRAP_ADMIN_APELLIDO` | `<apellido-admin>` | `src/database/seeds/bootstrap-admin.config.ts:29,43` | **Obligatoria** en `bootstrap:admin`; no vacía tras `trim`. |

### 2.4 Variables del Frontend / BFF (`sis-iva-frontend/.env.example` y `config/*.php`)

| Variable | Placeholder / Valor local | Origen | Notas |
|---|---|---|---|
| `APP_NAME`, `APP_ENV`, `APP_DEBUG`, `APP_URL` | `Laravel`, `local`, `true`, `http://localhost:8000` | `.env.example:1-5` | Configuración base del BFF. |
| `APP_KEY` | `<app-key-generada>` | `.env.example:3` | Generada con `php artisan key:generate` solo al crear `.env`. |
| `DB_CONNECTION` | `mysql` (en `.env.example`) / `sqlite` (default en `config/database.php:19`) | `.env.example:7`, `config/database.php:19` | Motor de la **base de datos propia del BFF** (separada de la API). |
| `DB_URL` | `<no-definir-o-url-local>` | `config/database.php:36,48,68` (`env('DB_URL')`) | Si existe en `.env` o en el entorno, Laravel la resuelve sobre la conexión activa y pisa `DB_HOST`/`DB_DATABASE` individuales. |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | `127.0.0.1`, `3306`, `<bd_bff_local>`, `<usuario-bd-bff>`, `<password-bd-bff>` | `.env.example:8-12` | Conexión local de la BD propia del BFF (distinta de `<bd_temporal_qa_local>` y de `bd_sis_iva`). |
| `SESSION_DRIVER`, `SESSION_LIFETIME`, `SESSION_ENCRYPT` | `database`, `120`, `false` | `.env.example:14-16`, `config/session.php` | Sesiones web del BFF. |
| `API_SEGURO_URL` | `http://localhost:9031` (o `http://127.0.0.1:<PORT>`) | `.env.example:19`, `config/services.php` | URL local de la API NestJS consumida por `ApiHelper` (debe apuntar a `localhost` o `127.0.0.1` en el `PORT` local de la API). |
| `API_SEGURO_KEY` | `<api-key-local>` | `.env.example:20`, `config/services.php` | Debe coincidir con `API_KEY` de la API para las rutas con `X-API-KEY`. |

> **Aclaración importante sobre la BD del BFF**: la base de datos del BFF es independiente de la base de datos de la API. Sus 3 migraciones estándar de Laravel (`users`, `cache`, `jobs` en `sis-iva-frontend/database/migrations/`) sostienen la sesión e infraestructura local del BFF y **no implican soporte multiempresa**.

### 2.5 Avisos críticos de seguridad en la carga de variables

- Tanto `seed:catalogs`, `bootstrap:admin` como el CLI de migraciones llaman a `dotenv.config()` (leen `.env` si existe), y en el runtime de la API `ConfigModule.forRoot()` (`src/app.module.ts:46`) también carga `.env` sin `ignoreEnvVars`. **Las variables de entorno definidas con valor no vacío en la sesión de PowerShell (`$env:...`) prevalecen** sobre los valores de `.env`.
- **Prohibido sugerir o usar `Remove-Item Env:...` o asignar cadena vacía (`$env:VAR = ''`) antes de arrancar la API para neutralizar `.env`**: en Windows/PowerShell, eliminar una variable de `Env:` o asignarle `''` la quita del bloque de entorno del proceso; cuando `dotenv` / `ConfigModule.forRoot()` se ejecuta al iniciar la API, **recarga automáticamente desde `.env` cualquier variable que no exista en `process.env`**. Para neutralizar un valor presente en `.env` desde la sesión de PowerShell, siempre debe sobrescribirse con un valor local/simulado no vacío antes del arranque.
- **Peligro en el arranque de la API (`AppModule`, SMTP, R2 y Google OAuth heredado)**:
  - **Base de datos (`DB_*`)**: a diferencia de `data-source.ts` y `seed-connection.ts`, **`AppModule` (`src/app.module.ts:48-58`) usa `DB_*` sin allowlist local**. Si `.env` contiene credenciales hacia un servidor remoto, arrancar la API sin sobrescribir antes `$env:DB_HOST` y `$env:DB_DATABASE` conectará el runtime al servidor remoto.
  - **SMTP (`MAIL_*`) y Cloudflare R2 (`R2_*`)**: `NotificationsModule` (`src/common/notifications/notifications.module.ts:18-35`) y `ImageOptimizationService` (`src/negocio/ocr-tax/services/image-optimization/image-optimization.service.ts:16-23,48,55`) leen `MAIL_*` y `R2_*` desde el entorno/`.env`. Si `.env` apunta a SMTP o R2 remotos/productivos, un recorrido local que cree usuarios con `es_temporal: false` (dispara email de bienvenida) o invoque `forgot-password` enviará correos reales, y cualquier subida de comprobantes impactará el bucket remoto.
  - **Google OAuth heredado (`GOOGLE_*`)**: `getGoogleOAuthConfig` (`src/auth/config/google-oauth.config.ts:12-20`) evalúa `.trim()` sobre `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_CALLBACK_URL`. Si `.env` contiene credenciales Google heredadas, deben pisarse en la sesión con un espacio (`' '`) para que la variable permanezca definida en `process.env` (evitando que `dotenv` recargue `.env`) y `.trim()` resulte vacío (`null`), manteniendo desactivado Google OAuth (P0.1 / D2).
  - **Acción obligatoria antes de `npm run start:dev` (§5.2)**: en la misma sesión de PowerShell, fijar explícitamente `$env:PORT = '9031'` (o el puerto local elegido) y neutralizar los servicios externos: `$env:MAIL_HOST = '127.0.0.1'` (o un servidor SMTP de captura local), definir `R2_*` hacia loopback local (nunca `R2_*` remotos) y neutralizar `GOOGLE_*`. **No ejecutar escenarios que envíen email ni OCR/R2 mientras no exista un destino/servicio local o simulado o el escenario esté bloqueado.**

---

## 3. Instalación de dependencias

En una sesión de PowerShell 5.1 (reemplazar `<ruta-repo-api>` y `<ruta-repo-bff>` por las rutas locales de cada repositorio):

```powershell
# 1. Dependencias de la API (NestJS)
Set-Location '<ruta-repo-api>'
npm ci

# 2. Dependencias del BFF (Laravel + Vue/Vite)
Set-Location '<ruta-repo-bff>'
composer install
npm ci

# 3. Crear .env del BFF únicamente si no existe (no sobrescribir uno existente)
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    php artisan key:generate
}
```

> **Advertencia sobre `php artisan key:generate`**: ejecutarlo **únicamente** sobre un archivo `.env` recién creado. Correrlo sobre un `.env` ya configurado reemplaza `APP_KEY` e invalida sesiones o datos cifrados previos.

---

## 4. Base de datos temporal local y esquema

1. **Elegir un nombre explícito de base de datos temporal local**:
   - Usar un identificador dedicado a la prueba (placeholder `<bd_temporal_qa_local>`, por ejemplo `bd_sis_iva_qa_temp`), **distinto de `bd_sis_iva`** y nunca el nombre de la base de QA.
2. **Crear la base de datos temporal desde el cliente interactivo local**:
   - Iniciar el cliente SQL local pidiendo la contraseña de forma interactiva (`-p` sin valor adjunto):

```powershell
$dbUser = Read-Host 'Usuario BD local'
mysql -u $dbUser -h 127.0.0.1 -P 3306 -p
```

   - Dentro de la consola interactiva de `mysql`, ejecutar:
     - `CREATE DATABASE <bd_temporal_qa_local> CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
3. **Carga del esquema — bifurcación obligatoria**:
   - **Ruta vigente (histórica, solo para MySQL 8 local)**:
     - Dentro del cliente interactivo `mysql` conectado a `127.0.0.1`, seleccionar `<bd_temporal_qa_local>` y cargar `<ruta-repo-api>/database/baseline/0000-current-schema-mysql8.sql`:
       - `USE <bd_temporal_qa_local>;`
       - `SOURCE <ruta-repo-api>/database/baseline/0000-current-schema-mysql8.sql;`
       - `SHOW TABLES;` *(verificar que existan las 21 tablas del baseline).*
   - **Ruta objetivo (MariaDB 11.8.x + migraciones TypeORM)**:
     - **DETENERSE AQUÍ (PUERTA BLOQUEADA).**
     - El directorio `src/database/migrations/` está **vacío**. Ejecutar `npm run migration:run` sobre una base de datos vacía **no crea ninguna tabla del sistema** (únicamente crea la tabla de metadatos `migrations` con 0 filas).
     - **Prohibición explícita**: no cargar automáticamente (ni manualmente) el baseline MySQL 8 histórico (`database/baseline/0000-current-schema-mysql8.sql`) en MariaDB 11.8 como sustituto de la migración inicial (D23 no validado).
     - **Prerrequisito pendiente**: antes de poder instalar desde cero por esta ruta, debe crearse y aprobarse la migración inicial versionada compatible con MariaDB 11.8.x (D23).
4. **Advertencia sobre `migration:show` y `migration:run` (antecedente P0.6b)**:
   - Tanto `npm run migration:show` como `npm run migration:run` crean la tabla `migrations` en la base objetivo al conectarse. Solo deben invocarse contra `<bd_temporal_qa_local>` en `127.0.0.1` y únicamente cuando existan archivos de migración en `src/database/migrations/`.
   - En esta guía operativa están **excluidas y prohibidas** las operaciones de reversión o autogeneración de migraciones y cualquier variante destructiva que borre o vacíe tablas.

---

## 5. Seed, bootstrap y arranque (una terminal por proceso; no cerrar ventanas)

Mantener una terminal independiente para cada proceso en ejecución y no cerrar terminales preexistentes ajenas a la prueba.

### 5.1 Terminal 1 (API): Seed de catálogos y Bootstrap del Administrador de Plataforma

Todas las credenciales se leen en memoria durante la sesión con `Read-Host` / `Read-Host -AsSecureString`:

```powershell
Set-Location '<ruta-repo-api>'
$env:SEED_DB_HOST = '127.0.0.1'
$env:SEED_DB_PORT = '3306'
$env:SEED_DB_USERNAME = Read-Host 'Usuario BD local'
$env:SEED_DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Password BD local' -AsSecureString)).Password
$env:SEED_DB_DATABASE = '<bd_temporal_qa_local>'
npm run seed:catalogs
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host 'Email admin (se guarda en minusculas)'
$env:BOOTSTRAP_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Password admin (min 12)' -AsSecureString)).Password
$env:BOOTSTRAP_ADMIN_NOMBRE = Read-Host 'Nombre'
$env:BOOTSTRAP_ADMIN_APELLIDO = Read-Host 'Apellido'
npm run bootstrap:admin
Remove-Item Env:SEED_DB_PASSWORD, Env:BOOTSTRAP_ADMIN_PASSWORD, Env:BOOTSTRAP_ADMIN_EMAIL -ErrorAction SilentlyContinue
```

**Códigos de salida (`Exit Codes`) de `npm run bootstrap:admin` (según `BOOTSTRAP_ADMIN.md`):**

| Exit Code | Resultado / Categoría | Significado operativo |
|---|---|---|
| `0` | `CREATED` |Se crearon `Persona` y `Usuario` con rol `Administrador` activo en una única transacción y hash explícito `bcrypt` (costo 10). |
| `0` | `ALREADY_ACTIVE_ADMIN` | Operación idempotente (no-op): ya existe un usuario activo con rol `Administrador`; el email suministrado no se evalúa ni se modifica nada. |
| `1` | Configuración inválida | Falta alguna variable `BOOTSTRAP_ADMIN_*`, el email no tiene formato válido o la contraseña tiene menos de 12 caracteres (falla antes de conectar a la BD). |
| `1` | `ROLE_NOT_FOUND` | No existe el rol `Administrador` en la tabla `roles` (falta ejecutar antes `npm run seed:catalogs`). |
| `1` | `EMAIL_EXISTS` | No existe administrador activo, pero el email suministrado ya pertenece a otro usuario; el script aborta sin elevar privilegios. |
| `1` | Error de BD / bloqueo de host | Fallo de conexión/transacción SQL o intento bloqueado por `seed-connection.ts` al no ser un host local permitido. |

### 5.2 Puerta obligatoria antes de arrancar la API en la Terminal 1

- Debido a que `AppModule`, `NotificationsModule` e `ImageOptimizationService` leen `DB_*`, `MAIL_*` y `R2_*` desde `.env` sin allowlist local, antes de `npm run start:dev` en la misma sesión de PowerShell es **obligatorio**:
  1. Fijar `$env:DB_*` hacia la instancia temporal local y `$env:PORT = '9031'` de forma explícita.
  2. Neutralizar los servicios externos en la misma sesión con valores locales/simulados no vacíos: `$env:MAIL_HOST = '127.0.0.1'` (o un servidor SMTP de captura local), definir `R2_*` hacia loopback local (nunca `R2_*` remotos) y neutralizar cualquier `GOOGLE_*` heredado con un espacio (`' '`, de modo que la variable permanezca definida en `process.env` —impidiendo que `dotenv` la recargue desde `.env`— y `.trim()` en `getGoogleOAuthConfig` resulte vacío y desactive Google OAuth conforme a P0.1 y D2).
  3. **Nunca usar `Remove-Item Env:...` ni asignar `''` antes de arrancar la API** para intentar anular `.env`, porque `dotenv` recargaría los valores remotos reales desde `.env`.
  4. **No ejecutar escenarios que envíen email** (como alta de usuario con `es_temporal: false` o `forgot-password`) **ni OCR/R2 mientras no exista un destino/servicio local o simulado o el escenario esté bloqueado.**

```powershell
$env:PORT = '9031'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3306'
$env:DB_DATABASE = '<bd_temporal_qa_local>'
$env:DB_USERNAME = Read-Host 'Usuario BD local (API runtime)'
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Password BD local (API runtime)' -AsSecureString)).Password
$env:JWT_SECRET = [System.Net.NetworkCredential]::new('', (Read-Host 'JWT_SECRET local' -AsSecureString)).Password
$env:API_KEY = [System.Net.NetworkCredential]::new('', (Read-Host 'API_KEY local (debe coincidir con API_SEGURO_KEY)' -AsSecureString)).Password

# Neutralizar SMTP, R2 y Google OAuth en la sesion (no usar Remove-Item ni '' para evitar que dotenv recargue .env)
$env:MAIL_HOST = '127.0.0.1'
$env:MAIL_PORT = '1025'
$env:MAIL_SECURE = 'false'
$env:MAIL_USER = 'local-disabled'
$env:MAIL_PASS = 'local-disabled'
$env:MAIL_FROM = 'noreply@localhost'
$env:MAIL_IGNORE_TLS = 'true'
$env:R2_ENDPOINT = 'http://127.0.0.1:9000'
$env:R2_ACCESS_KEY = 'local-disabled'
$env:R2_SECRET_KEY = 'local-disabled'
$env:R2_BUCKET_NAME = 'local-disabled'
$env:R2_PUBLIC_URL = 'http://127.0.0.1:9000/local-disabled'
$env:GOOGLE_CLIENT_ID = ' '
$env:GOOGLE_CLIENT_SECRET = ' '
$env:GOOGLE_CALLBACK_URL = ' '
$env:GOOGLE_REDIRECT_FRONTEND_URL = 'http://localhost:8000'

if ($env:DB_HOST -notin @('127.0.0.1', 'localhost', '::1')) {
    throw "PUERTA BLOQUEADA: DB_HOST ($($env:DB_HOST)) no es local. No arrancar la API."
}
if ([string]::IsNullOrWhiteSpace($env:DB_DATABASE) -or $env:DB_DATABASE -eq 'bd_sis_iva') {
    throw "PUERTA BLOQUEADA: DB_DATABASE debe ser la BD temporal local aislada."
}
if ($env:MAIL_HOST -notin @('127.0.0.1', 'localhost', '::1')) {
    throw "PUERTA BLOQUEADA: MAIL_HOST ($($env:MAIL_HOST)) no es local. Neutralizar SMTP antes de arrancar."
}
if ($env:R2_ENDPOINT -notmatch '^https?://(127\.0\.0\.1|localhost|\[::1\])(:\d+)?(/|$)') {
    throw "PUERTA BLOQUEADA: R2_ENDPOINT no apunta a loopback local. Neutralizar R2 antes de arrancar."
}
if (-not (Test-Path Env:GOOGLE_CLIENT_ID) -or -not [string]::IsNullOrWhiteSpace($env:GOOGLE_CLIENT_ID) -or -not (Test-Path Env:GOOGLE_CLIENT_SECRET) -or -not [string]::IsNullOrWhiteSpace($env:GOOGLE_CLIENT_SECRET) -or -not (Test-Path Env:GOOGLE_CALLBACK_URL) -or -not [string]::IsNullOrWhiteSpace($env:GOOGLE_CALLBACK_URL)) {
    throw "PUERTA BLOQUEADA: GOOGLE_* debe estar neutralizado con espacio en sesion (D2)."
}
Write-Host "Verificacion local OK -> PORT=$($env:PORT) | DB_HOST=$($env:DB_HOST) | DB_DATABASE=$($env:DB_DATABASE) | MAIL_HOST=$($env:MAIL_HOST)"
npm run start:dev
```

### 5.3 Terminal 2 (BFF Laravel) y Terminal 3 (Vite)

1. **Reglas de la puerta de configuración y caché del BFF (antes de `php artisan migrate` y `php artisan serve`)**:
   - Si existe `bootstrap/cache/config.php` (generado por `config:cache`), Laravel ignora `.env` y la revisión visual de `.env` no protege. Antes de migrar o servir, verificar `Test-Path bootstrap\cache\config.php`; si devuelve `True`, ejecutar `php artisan config:clear` (no destructivo para datos) y volver a verificar que `Test-Path bootstrap\cache\config.php` sea `False`.
   - **Prohibido ejecutar `php artisan config:show database` completo** (expondría `password` en pantalla) **y prohibido ejecutar `php artisan db:show` antes de validar el host** (intentaría abrir una conexión real hacia el servidor configurado si fuera remoto).
   - Verificar la configuración efectiva resuelta (incluyendo la resolución de `DB_URL` si existiera) mediante **solo lectura de configuración sin `getPdo()` ni consultas SQL**, usando `php artisan tinker --execute` para mostrar **únicamente** `DB::connection()->getConfig('driver')`, `DB::connection()->getConfig('host')`, `DB::connection()->getConfig('database')` y `config('services.api_seguro.url')`.
   - Exigir que el host resuelto sea local (`127.0.0.1`, `localhost` o `::1`), que la base de datos del BFF sea local y **separada** de la BD de la API (`<bd_temporal_qa_local>`) y distinta de `bd_sis_iva`, y que `API_SEGURO_URL` (`services.api_seguro.url`) sea `http://localhost:<PORT>` o `http://127.0.0.1:<PORT>` (con `API_SEGURO_KEY` igual al `API_KEY` efímero de la API).
   - **No ejecutar `php artisan config:cache`** durante la prueba.
2. En la **Terminal 2 (servidor BFF)**, verificar caché y configuración efectiva y, **solo tras confirmar destino local**, ejecutar la migración estándar del BFF y levantar el servidor:

```powershell
Set-Location '<ruta-repo-bff>'
if (Test-Path 'bootstrap\cache\config.php') {
    php artisan config:clear
}
if (Test-Path 'bootstrap\cache\config.php') {
    throw 'PUERTA BLOQUEADA: bootstrap\cache\config.php sigue presente tras config:clear.'
}

$tinkerCode = 'echo json_encode(["driver" => DB::connection()->getConfig("driver"), "host" => DB::connection()->getConfig("host"), "database" => DB::connection()->getConfig("database"), "api_url" => config("services.api_seguro.url")]);'
$bffRaw = php artisan tinker --execute="$tinkerCode"
$bffJsonLine = ($bffRaw | Where-Object { $_ -match '^\{.*\}$' } | Select-Object -Last 1)
if (-not $bffJsonLine) {
    throw 'PUERTA BLOQUEADA: no se pudo leer la configuracion resuelta del BFF.'
}
$bffCfg = $bffJsonLine | ConvertFrom-Json
if ($bffCfg.driver -ne 'sqlite' -and $bffCfg.host -notin @('127.0.0.1', 'localhost', '::1')) {
    throw "PUERTA BLOQUEADA: host de BD del BFF ($($bffCfg.host)) no es local. No migrar ni servir."
}
if ([string]::IsNullOrWhiteSpace($bffCfg.database) -or $bffCfg.database -eq 'bd_sis_iva' -or $bffCfg.database -eq '<bd_temporal_qa_local>') {
    throw "PUERTA BLOQUEADA: la BD del BFF debe ser local y separada de bd_sis_iva y de la BD de la API."
}
if ($bffCfg.api_url -notmatch '^http://(localhost|127\.0\.0\.1)(:\d+)?/?$') {
    throw "PUERTA BLOQUEADA: services.api_seguro.url ($($bffCfg.api_url)) debe ser http://localhost:<PORT> o http://127.0.0.1:<PORT>."
}
Write-Host "BFF config local OK -> driver=$($bffCfg.driver) | host=$($bffCfg.host) | database=$($bffCfg.database) | api_url=$($bffCfg.api_url)"

php artisan migrate
php artisan serve
```

3. En la **Terminal 3 (compilador de assets Vite)**:

```powershell
Set-Location '<ruta-repo-bff>'
npm run dev
```

---

## 6. Validación y recorrido QA

### 6.1 Comprobación de humo (Smoke) y headers requeridos por los guards

1. **Headers exigidos por la API según el código**:
   - **`Authorization: Bearer <jwt>`**: requerido por `JwtAuthGuard` en las rutas protegidas por JWT (incluyendo `/pais` en `src/referenciales/geograficos/pais/pais.controller.ts:20`, `/roles`, `/menu`, `/grupo-menu`, `/menu-rol`, `/usuarios`, `/comprobantes`, etc.). Las 21 rutas administrativas de `/roles`, `/menu`, `/grupo-menu` y `/menu-rol` exigen además `AdministradorGuard` (P1a.1).
   - **`X-API-KEY: <api-key-local>`**: requerido por `ApiKeyGuard` (`src/common/guards/api-key.guard.ts:23`) en `/departamento` (`src/referenciales/geograficos/departamento/departamento.controller.ts:20`) y `/ciudad` (`src/referenciales/geograficos/ciudad/ciudad.controller.ts:20`).
2. **Smoke de `POST /auth/login` en PowerShell 5.1 (sin imprimir tokens ni secretos)**:
   - El correo debe ingresarse en **minúsculas** (tal como lo normaliza `bootstrap:admin`).
   - La URI toma `$env:PORT` si está definido o `9031` por defecto (ajustar si se definió otro `PORT` al iniciar la API).
   - Si se verifica con `Invoke-RestMethod`, **no imprimir la respuesta `$r`**; inspeccionar únicamente los nombres de las propiedades devueltas (`$r.PSObject.Properties.Name`) y eliminar la variable de inmediato:

```powershell
$smokePort = if ($env:PORT) { $env:PORT } else { '9031' } # Ajustar si se definio PORT distinto en la API
$smokeEmail = (Read-Host 'Email admin en minusculas').Trim().ToLower()
$smokePass = [System.Net.NetworkCredential]::new('', (Read-Host 'Password admin' -AsSecureString)).Password
$smokeBody = @{ email = $smokeEmail; password = $smokePass } | ConvertTo-Json -Compress
Remove-Variable smokePass -ErrorAction SilentlyContinue
$r = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$smokePort/auth/login" -ContentType 'application/json' -Body $smokeBody
Remove-Variable smokeBody -ErrorAction SilentlyContinue
$r.PSObject.Properties.Name
Remove-Variable r -ErrorAction SilentlyContinue
```

### 6.2 Matriz de recorrido QA y puertas de bloqueo reales

Ningún escenario de esta tabla ha sido ejecutado en este corte documental (`NO EJECUTADO`).

| ID | Actor / Escenario | Precondición | Resultado esperado | Puerta (bloqueo real) | Estado |
|---|---|---|---|---|---|
| `QA-01` | **Admin Plataforma** (`<email-admin-plataforma>`) en `/roles`, `/menu`, `/grupo-menu`, `/menu-rol` y login BFF | Esquema baseline MySQL 8 en `<bd_temporal_qa_local>`, `seed:catalogs`, `bootstrap:admin`, API y BFF locales activos | Login exitoso en BFF (email en minúsculas); acceso `200 OK` a `/roles` y `/menu-rol`; usuarios con rol `Contador` o `Solo Lectura` reciben `403 Forbidden` en las 21 rutas de parámetros (P1a.1). | Ejecutable hoy localmente sobre el esquema baseline MySQL 8 | `NO EJECUTADO` |
| `QA-02` | **Usuario inactivo** (`<email-usuario-inactivo>`) intenta iniciar sesión | Usuario existente con `activo = false` | `POST /auth/login` rechaza las credenciales (`401`) y no emite tokens (P0.3). | Ejecutable hoy localmente | `NO EJECUTADO` |
| `QA-03` | **Expiración/401 de JWT en BFF** | Sesión activa en BFF y respuesta `401` desde la API en una llamada con JWT | `ApiHelper` + `TerminateExpiredApiSession` cierran la sesión local, invalidan sesión, regeneran CSRF y redirigen a `/login` (`302` en GET/HEAD, `303` en otros métodos) sin mostrar listas vacías falsas (P1a.5a). | Ejecutable hoy localmente | `NO EJECUTADO` |
| `QA-04` | **Catálogos (`parametros.*`) y filtros de consulta** (compras, ventas, suscripciones, cuotas, asignaciones) | Admin autenticado en BFF | Redirecciones tras alta/edición/baja usan `parametros.*` sin error (P1b.1); filtros `contribuyente_id`, `estado_ocr`, etc. no devuelven `400` (P1b.2); errores de API se normalizan y muestran en `ApiHelper` (P1b.3). | Ejecutable hoy localmente (paginación remota pendiente en P1b.4) | `NO EJECUTADO` |
| `QA-05` | **Contador y Solo Lectura en el BFF** (`<email-contador-empresa-a>`, `<email-lectura-empresa-a>`) | Cuentas de prueba creadas y login BFF habilitado para roles no-Admin | Inicio de sesión permitido según D1; menú filtrado por `menu_rol`; `Solo Lectura` sin acciones de escritura. | **BLOQUEADO** por **P1a.7** (el BFF hoy exige el literal `"Administrador"` al iniciar sesión) y cuentas de prueba diferidas por el usuario | `NO EJECUTADO` |
| `QA-06` | **Administradores y Contadores de Empresa A y Empresa B + acceso cruzado A→B denegado** (`<email-admin-empresa-a>`, `<email-contador-empresa-a>`, `<email-admin-empresa-b>`, `<email-contador-empresa-b>`, `<email-contador-multiempresa-ab>`) | Esquema multiempresa, cartera `empresa_contribuyente`, dataset D21 sin equipos | Empresa A solo ve y opera datos de A; Empresa B solo ve y opera datos de B. Todo intento cruzado A→B es denegado, incluso cuando el mismo RUC (`C_COMPARTIDO`) está en ambas carteras o existen alias de email o membresía múltiple (D16, D18, D19). | **BLOQUEADO** por **MIGRACIÓN MULTIEMPRESA** y **P1a.6a–e** | `NO EJECUTADO` |
| `QA-07` | **Cliente / contribuyente asignado por usuario (sin equipos)** | Relación `asignaciones_contables` vinculada a la cartera de la empresa | Hoy existe `asignaciones_contables(usuario_id, contribuyente_id)` sin empresa (parcial); en el modelo objetivo (D17 reemplazada + D18) el contador solo accede a los contribuyentes asignados dentro de su empresa. | **PARCIAL / BLOQUEADO** para multiempresa y aislamiento efectivo por **MIGRACIÓN MULTIEMPRESA** y **P1a.6** | `NO EJECUTADO` |
| `QA-08` | **Etapas comerciales `LIBRE` y SaaS pagado (`PAGO`/posible `FREE`)** | Operación gestionada inicial sin cargo, con acceso `LIBRE` total | El Administrador de Plataforma concede `LIBRE` al inicio; el equipo gestiona documentos de clientes sin cobrar uso del sistema. El acceso directo SaaS será pagado en una etapa posterior. Cuota/medición por usuario que carga facturas es una hipótesis por definir (Q1/D11); la gratuidad nunca desactiva el aislamiento empresarial. | **BLOQUEADO** para cobros por Q1/D11 y **Fase SaaS (S.1–S.5)**; la etapa gestionada inicial no depende de esas reglas comerciales. | `NO EJECUTADO` |
| `QA-09` | **Unión de empresas (A y B)** | Decisión D24 definida y plan de 5 requisitos aprobado | Ejecución de fusión real o gestión conjunta sin colisiones no resueltas, con trazabilidad completa y aislamiento frente a terceros. | **BLOQUEADO** por **Q2 / D24 (PENDIENTE)**, **D5 (PENDIENTE)** y el plan de `TENANCY_COMMERCIAL_MODEL.md` §6.2 | `NO EJECUTADO` |
| `QA-10` | **Comprobantes de compra/venta y estados D6** (`AUTO_PROCESADO`, `REQUIERE_REVISION`, `PROCESANDO`, `VERIFICADO_HUMANO`, `ERROR_PROCESAMIENTO`) | Máquina de estados única y validador fiscal unificado | Transiciones controladas por acciones explícitas (reclamar → `PROCESANDO`; confirmar/corregir → `VERIFICADO_HUMANO`); PATCH directo de `estado_ocr` rechazado. | **PARCIAL / BLOQUEADO** en sus reglas completas por **P1c.1–P1c.6** (D5 pendiente) y **P1d.7** | `NO EJECUTADO` |
| `QA-11` | **Flujo OCR e imágenes en R2** | Validador OCR, padrón `set_rucs` y modelo de acceso privado a R2 | Comprobante con datos faltantes o padrón ausente pasa a `REQUIERE_REVISION`; imágenes resguardadas con acceso controlado. | **BLOQUEADO** por **P1d.1–P1d.6** y decisiones **D9 (PENDIENTE)** y **D10 (PENDIENTE)** | `NO EJECUTADO` |
| `QA-12` | **Exportación RG90** | Especificación oficial RG90, builder corregido y filtro por estados D6 | Exporta únicamente comprobantes en `AUTO_PROCESADO` y `VERIFICADO_HUMANO`; conserva importes de 5 %, 10 % y exentas sin alterar `estado_ocr`. | **BLOQUEADO** por **P1d.8–P1d.11** y decisión **D8 (PENDIENTE)** | `NO EJECUTADO` |
| `QA-13` | **Google OAuth** | Variables `GOOGLE_*` vacías o ausentes | La API arranca sin Google configurado (P0.1). **No configurar credenciales Google** en esta etapa (D2). | **NO CONFIGURAR** por decisión **D2**; flujo OAuth seguro bloqueado por **P1a.8a–d** | `NO EJECUTADO` |

### 6.3 Troubleshooting concreto

- **Faltan variables `SEED_DB_*` o `MIGRATION_DB_*`**: el proceso termina inmediatamente con `exit code 1` informando qué variables obligatorias faltan (`seed-connection.ts:17-23`, `data-source.ts:17-23`), porque no existe fallback a `DB_*`.
- **Host no permitido o intento de conexión fuera de local**: la allowlist (`localhost`, `127.0.0.1`, `::1`) y la lista de bloqueo abortan la ejecución con `exit code 1`.
- **`ROLE_NOT_FOUND` al ejecutar `npm run bootstrap:admin` (`exit code 1`)**: la tabla `roles` aún no tiene el registro `Administrador`. Ejecutar primero `npm run seed:catalogs`.
- **`EMAIL_EXISTS` al ejecutar `npm run bootstrap:admin` (`exit code 1`)**: no hay ningún Administrador activo, pero el correo ingresado ya existe en `usuarios` con otro rol o inactivo. El script aborta para impedir una escalación accidental de privilegios.
- **Contraseña rechazada en `bootstrap:admin` (`exit code 1`)**: `BOOTSTRAP_ADMIN_PASSWORD` tiene menos de 12 caracteres (`BOOTSTRAP_PASSWORD_MIN_LENGTH = 12`).
- **`401 Unauthorized` en `/departamento` o `/ciudad`**: falta definir `API_KEY` en el entorno de la API o `API_SEGURO_KEY` en el BFF, o ambos valores no coinciden (`ApiKeyGuard` es *fail-closed*, P0.3).
- **El BFF cierra la sesión y redirige a `/login` inesperadamente**: una llamada autenticada con JWT hacia la API devolvió `401 Unauthorized` (por ejemplo, tras reiniciar la API con distinto `JWT_SECRET` o vencer el token) y `TerminateExpiredApiSession` cerró la sesión local (P1a.5a).
- **`npm run migration:run` finaliza sin crear las tablas de negocio**: comportamiento esperado mientras `src/database/migrations/` esté vacía; en MySQL 8 local debe usarse el baseline histórico (§4.3).

---

## 7. Limpieza de la sesión

1. **Una vez detenidos todos los procesos locales (`start:dev`, `artisan serve`, `npm run dev`), eliminar de la sesión de PowerShell las variables de entorno efímeras utilizadas** *(recordatorio: nunca ejecutar esta limpieza antes de `npm run start:dev` si existe `.env`, pues `dotenv` recargaría los valores de `.env`)*:

```powershell
Remove-Item Env:SEED_DB_HOST, Env:SEED_DB_PORT, Env:SEED_DB_USERNAME, Env:SEED_DB_PASSWORD, Env:SEED_DB_DATABASE -ErrorAction SilentlyContinue
Remove-Item Env:BOOTSTRAP_ADMIN_EMAIL, Env:BOOTSTRAP_ADMIN_PASSWORD, Env:BOOTSTRAP_ADMIN_NOMBRE, Env:BOOTSTRAP_ADMIN_APELLIDO -ErrorAction SilentlyContinue
Remove-Item Env:MIGRATION_DB_HOST, Env:MIGRATION_DB_PORT, Env:MIGRATION_DB_USERNAME, Env:MIGRATION_DB_PASSWORD, Env:MIGRATION_DB_DATABASE -ErrorAction SilentlyContinue
Remove-Item Env:PORT, Env:DB_HOST, Env:DB_PORT, Env:DB_USERNAME, Env:DB_PASSWORD, Env:DB_DATABASE, Env:JWT_SECRET, Env:API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:MAIL_HOST, Env:MAIL_PORT, Env:MAIL_SECURE, Env:MAIL_USER, Env:MAIL_PASS, Env:MAIL_FROM, Env:MAIL_IGNORE_TLS -ErrorAction SilentlyContinue
Remove-Item Env:R2_ENDPOINT, Env:R2_ACCESS_KEY, Env:R2_SECRET_KEY, Env:R2_BUCKET_NAME, Env:R2_PUBLIC_URL -ErrorAction SilentlyContinue
Remove-Item Env:GOOGLE_CLIENT_ID, Env:GOOGLE_CLIENT_SECRET, Env:GOOGLE_CALLBACK_URL, Env:GOOGLE_REDIRECT_FRONTEND_URL -ErrorAction SilentlyContinue
```

2. **Historial de la consola**:
   - Si se siguieron los bloques con `Read-Host -AsSecureString`, las contraseñas no quedan en el historial.
   - Si accidentalmente alguien pegó un valor sensible en texto plano en la línea de comando, limpiar el historial de la sesión (`Clear-History` y `[Microsoft.PowerShell.PSConsoleReadLine]::ClearHistory()`) **sin imprimir ni listar el historial en pantalla**.
3. **Retiro manual de la base de datos temporal `<bd_temporal_qa_local>`**:
   - La eliminación de la base de datos temporal local es un **paso manual** que el operador realiza desde el cliente interactivo local después de verificar el nombre exacto de `<bd_temporal_qa_local>`.
   - **Prohibido** aplicar acciones de borrado sobre `bd_sis_iva` ni sobre ningún entorno de QA o producción. *(Por norma de seguridad, no se incluyen sentencias destructivas en esta guía).*

---

## 8. Checklist de cierre (documental vs ejecución)

### 8.1 Cierre documental (`G1`)

- [ ] **G1 — Documentación redactada y aprobada**: `.ai-work/TENANCY_COMMERCIAL_MODEL.md` y `.ai-work/OPERATIONS_QA_GUIDE.md` redactados por AGY, revisados por Claude y aprobados en checkpoint por Codex *(única casilla que puede pasar a `[x]` sin ejecución en BD/runtime)*.

### 8.2 Cierre de ejecución (`G2`–`G4` — prohibido marcar `[x]` sin evidencia real de ejecución)

- [ ] **G2 — Instalación local limpia desde cero vía migraciones en MariaDB 11.8.x** *(requiere evidencia de ejecución; hoy BLOQUEADA por falta de migración inicial MariaDB versionada)*.
- [ ] **G3 — Recorrido QA E2E multiempresa, roles y etapas comerciales** *(requiere evidencia de ejecución; hoy BLOQUEADO por `MIGRACIÓN MULTIEMPRESA`, `P1a.6`, `P1a.7`, `P1c`/`P1d`; cobros futuros por Q1/D11)*.
- [ ] **G4 — Simulación y ejecución controlada de unión de empresas** *(requiere evidencia de ejecución; hoy BLOQUEADA por `D24`/`Q2` y aprobación del plan de 5 requisitos)*.

---

## 9. Resumen de tareas y decisiones pendientes

| Elemento | Categoría | Estado actual | Impacto / Qué bloquea |
|---|---|---|---|
| **Q1** | Regla comercial futura | **APLAZADA** | Definir unidad y medición de la cuota SaaS (se evaluará asociarla a usuarios que cargan facturas); no bloquea el servicio gestionado inicial ni la base multiempresa. |
| **Q2** | Pregunta al usuario | **PENDIENTE** | Definición de unión de empresas (**D24**): fusión real de datos o gestión conjunta. |
| **D11** | Decisión de producto | **PARCIAL / PENDIENTE** | Etapa inicial gestionada sin cargo en `LIBRE` total; acceso directo futuro pagado. Unidad/cuota, límites `FREE`, precios y reglas comerciales restantes pendientes. |
| **D20** | Decisión de producto | **ETAPAS DEFINIDAS; DETALLE SaaS APLAZADO** | Unidad y medición del cobro directo futuro (Q1); no bloquea empresas, membresías ni aislamiento. |
| **D24** | Decisión de producto | **PENDIENTE (Q2)** | Unión de empresas y aprobación de los 5 requisitos previos (`TENANCY_COMMERCIAL_MODEL.md` §6.2). |
| **D4, D5, D7, D8, D9, D10, D12, D13** | Decisiones de producto | **PENDIENTE** | Persona-documentos (`D4`), clave fiscal y duplicados (`D5`), timbrados (`D7`), especificación RG90 (`D8`), padrón SET (`D9`), acceso privado a R2 (`D10`), volumen/cola OCR (`D12`), rotación de credenciales históricas (`D13`). |
| **Migración inicial MariaDB 11.8** | Tarea técnica | **PENDIENTE** | Necesaria para que `npm run migration:run` instale el esquema desde cero en MariaDB 11.8.x (`D23`) y desbloquee `G2`. |
| **MIGRACIÓN MULTIEMPRESA** | Tarea de roadmap | **PENDIENTE** | Creación del esquema y lógica base de empresas, membresías (`D16`), cartera `empresa_contribuyente` (`D18`), comprobantes con tenant (`D19`) y acceso por usuario sin equipos (`D17` reemplazada; detalle técnico de permisos finos pendiente de diseño si aplica). |
| **P1a.6 / P1a.7 / P1a.8** | Tareas de seguridad | **PENDIENTE** | Aislamiento por módulo (`P1a.6a–e`), login de Contador y Solo Lectura en el BFF (`P1a.7`) y Google OAuth seguro sin auto-alta (`P1a.8a–d`). |
| **P1c / P1d / P1e / Fase SaaS** | Tareas de negocio | **PENDIENTE** | Máquina de estados D6 completa (`P1c.2`), validador único (`P1c.3`), flujo OCR (`P1d.1–7`), exportación RG90 (`P1d.8–11`), `SuscripcionGuard` (`P1e.1`) y planes/límites (`S.1–S.5`). |
