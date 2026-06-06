# Facturación IVA API

API REST SaaS para lectura, registro y exportación de comprobantes fiscales tributarios de Paraguay (SET/Marangatu).

**Stack:** NestJS 11 · TypeORM 0.3 · MySQL 8.0 · JWT · Google OAuth2 · Tesseract.js · Cloudflare R2

---

## Requisitos

- Node.js 18+
- MySQL 8.0
- npm

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env` en la raíz (ver sección de variables de entorno más abajo o `CLAUDE.md` para referencia completa).

## Levantar el servidor

```bash
# Desarrollo (watch mode)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

El servidor arranca en el puerto definido por `PORT` (default: `9031`).

## Base de datos

Aplicar el schema completo (tablas + seed):

```bash
mysql -u root -pTUPASSWORD < schema_bd_sis_iva.sql
```

Incluye: 22 tablas, roles, menús, 41 permisos y usuario admin inicial.

**Credenciales admin:** `admin@sistema.com` / `12356`

## URLs

| Entorno | URL |
|---|---|
| Local | `http://localhost:9031` |
| QA | `https://api-qa.acbldeveloper.com` |

## Variables de entorno requeridas

```env
PORT=9031

DB_HOST=
DB_PORT=3306
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=bd_sis_iva

JWT_SECRET=
JWT_EXPIRATION=8h

CORS_ORIGIN=http://localhost:3000
API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api-qa.acbldeveloper.com/auth/google/callback
GOOGLE_REDIRECT_FRONTEND_URL=http://localhost:3000

R2_ENDPOINT=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
MAIL_IGNORE_TLS=false
```

## Documentación

| Archivo | Contenido |
|---|---|
| `CLAUDE.md` | Referencia técnica completa del sistema (stack, entidades, guards, lógica) |
| `API_ENDPOINTS.md` | Documentación detallada de todos los endpoints con ejemplos |
| `SISTEMA_IVA_GUIA.md` | Guía de implementación para frontend y mobile |
| `basededatos.md` | Arquitectura y estructura de la base de datos |
