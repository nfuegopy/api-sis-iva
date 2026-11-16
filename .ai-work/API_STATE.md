# Estado resumido API — 2026-09-26

Repo separado `Facturacion-IVA`, NestJS 11/TypeORM/MySQL. Rama `a1`, HEAD `bba7f5e16867274093671eaccb8cdee2683305ae`. Limpia y sincronizada origin/a1; árbol idéntico origin/main (`07bed3847a75e3128e491b52fc0860f37b643869`). No cambiar main, commit/push ni implementar sin autorización.

- Compila: tsc noEmit y Nest build (TEMP) pasan.
- Jest: 7/31 suites pasan, 24 fallan; tests 7 pasan/16 fallan. E2E no arranca por alias src/. Mocks incompletos y suite países sin tests.
- Lint: 1264 errores/30 warnings, principalmente Prettier (1155 incidencias).
- BD configurada: 21 tablas/21 entidades, ninguna columna esperada ausente; sin unicidad fiscal compras/ventas; padrón set_rucs vacío. Solo SELECT realizados.
- TERMINADO (alcance limitado): JwtStrategy (firma/expiración/activo/rol actual), cron limpieza tokens.
- PARCIAL: login/refresh/reset, usuarios/personas/contribuyentes, catálogos, compras/ventas/timbrados, bolsa, OCR Tesseract/Vision/R2, suscripciones/cuotas, SMTP, errores/config.
- ROTO: Google vacío bloquea constructor/arranque, autorización administrativa, aislamiento incompleto, filtros (PaginacionDto+whitelist), PersonaDocumentosService plantilla, validación OCR, RG90, tests.
- PENDIENTE: planes/límites/estado cuenta/generación cuotas, auditoría, Redis/BullMQ, Swagger, migraciones, líneas de comprobantes si se requieren.
- Implementado sin integrar: TaxValidationService heredado, cotizaciones/email y findOrCreateByEmail; capturas para entrenamiento sin entrenador.

## Riesgos críticos

1. .env Google vacío + fallback ?? + provider obligatorio -> `OAuth2Strategy requires a clientID option`.
2. Solo JWT protege menu-rol/roles/menu/grupo-menu -> autoasignación de permisos. Solo OCR restringe asignación contribuyente.
3. Usuarios/relaciones exponen hashes; SMTP BCC fijo copia tokens reset y bienvenida con password plano.
4. CSV ventas anula 5%/exento; exporta pendientes; no escape/DV/formato certificado.
5. OCR puede aprobar falta de número/timbrado y sustituir fecha por hoy; confianza Vision=99; sin transacción/idempotencia; reclamo bolsa no atómico.
6. SQL requerido README ignorado; backup versionado viejo; synchronize=false y sin migraciones.
7. SuscripcionGuard permite ausencia/morosidad/trial NULL y no define ciclo comercial.

Decisiones pendientes: alcance admin vs multirrol; acceso/ownership por contribuyente; modelo planes/precio/límites/trial/morosidad; detalle por ítems/emisión vs registro; formato RG90 a validar; proveedores/entornos/despliegue; orden definitivo tras frontend. Ver API_AUDIT.md; frontend separado `../sis-iva-frontend`; consolidación en SYSTEM_STATE.md/TASKS.md.
