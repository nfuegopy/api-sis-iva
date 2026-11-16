# FacturaciÃ³n IVA API

> ⚠️ **Corregido P0.7** C1: Autoridad .ai-work (vigente).

API REST SaaS para lectura, registro y exportaciÃ³n de comprobantes fiscales tributarios de Paraguay (SET/Marangatu).

**Stack:** NestJS 11 Â· TypeORM 0.3 Â· MySQL 8.0 Â· JWT Â· Google OAuth2 Â· Tesseract.js Â· Cloudflare R2

---

## Requisitos

- Node.js 18+
- MySQL 8.0
- npm

## Correcciones P0.7
| Sección | Corrección  |
|---|---|


## InstalaciÃ³n

```bash
npm install
```

## ConfiguraciÃ³n

Crear archivo `.env` en la raÃ­z (ver secciÃ³n de variables de entorno mÃ¡s abajo o `CLAUDE.md` para referencia completa).

## Levantar el servidor

```bash
# Desarrollo (watch mode)
npm run start:dev

# ProducciÃ³n
npm run build
npm run start:prod
```

El servidor arranca en el puerto definido por `PORT` (default: `9031`).

## Base de datos

> ⚠️ **Corregido P0.7** C4/C5: Retirado en P0.7. Baseline versionado 21 tablas, 37 menu_rol. Usar  `npm run bootstrap:admin`.

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

## DocumentaciÃ³n

| Archivo | Contenido |
|---|---|
| `CLAUDE.md` | Referencia tÃ©cnica completa del sistema (stack, entidades, guards, lÃ³gica) |
| `API_ENDPOINTS.md` | DocumentaciÃ³n detallada de todos los endpoints con ejemplos |
| `SISTEMA_IVA_GUIA.md` | GuÃ­a de implementaciÃ³n para frontend y mobile |
| `basededatos.md` | Arquitectura y estructura de la base de datos |
