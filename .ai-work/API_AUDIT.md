# Auditoría funcional de la API

Fecha: 2026-09-26. Repositorio: `Facturacion-IVA` / `https://github.com/nfuegopy/api-sis-iva.git`.
Rama auditada: `a1`. Commit: `bba7f5e16867274093671eaccb8cdee2683305ae`.
Este documento preserva la auditoría previa al análisis del frontend. No es autorización de implementación.

## Git y alcance

- Árbol local limpio, sincronizado con `origin/a1`.
- `git diff --exit-code a1 origin/main`: sin diferencias de contenido. Ambos árboles: `07bed3847a75e3128e491b52fc0860f37b643869`.
- `origin/main` tiene seis commits adicionales de integración; la rama `main` local está 28 commits atrasada. No se cambió ni actualizó ninguna rama.
- Revisión de código, documentación, configuración sin divulgar secretos, pruebas existentes y consultas SELECT a la BD configurada. No hubo cambios de código ni datos de negocio.
- Build Nest con configuración/salida en TEMP, fuera del proyecto; lint sin `--fix`; pruebas y reproducciones en memoria.
- No se enviaron emails, subieron imágenes ni ejecutaron OCR contra proveedores externos. No se verificó importación real en Marangatu ni normativa fiscal vigente.
- TERMINADO significa implementado e integrado para el alcance indicado, no certificación operativa de todos los servicios externos.

## Funcionalidades

| Funcionalidad | Estado | Evidencia | Qué falta |
|---|---|---|---|
| Login | PARCIAL | `AuthService.validateUser()` compara bcrypt y emite tokens, sin comprobar activo | Rechazo de inactivos y pruebas completas |
| JWT / guard | TERMINADO | `JwtStrategy` valida firma, expiración, existencia, activo y rol actual en BD | Regresión |
| Refresh / logout | PARCIAL | Tokens en BD con vencimiento, rotación y revocación | Rotación atómica; activo; revocar tras cambio/reset password |
| Recuperación contraseña | PARCIAL | Token aleatorio de 1h, usado, email y actualización hash | Consumo atómico; sesiones; entrega fiable |
| Google OAuth | ROTO | Constructor con .env local: `OAuth2Strategy requires a clientID option` | Opcionalidad segura, credenciales, callback sin tokens en URL |
| Usuarios | PARCIAL | CRUD, hash; devuelve entidades con password hash | Sanitizar; DTO activo; transacción usuario/persona |
| Roles/menús/permisos | ROTO | `MenuRolGuard` existe; controllers administrativos solo JWT | Evitar autoasignación de privilegios |
| Aislamiento por contribuyente | PARCIAL | Asignación contable comprobada en OCR, no CRUD/exportaciones/bolsa | Autorizar cada recurso y operación |
| Personas | PARCIAL | Transacciones para persona/documentos | Unicidad documental; proteger histórico al eliminar |
| Persona-documentos | ROTO | Service devuelve `This action...`; DTO vacío | CRUD real; gestión anidada en personas sí existe |
| Contribuyentes | PARCIAL | CRUD, RUC duplicado, soft delete | RUC/DV normalizado, consistencia, aislamiento |
| Timbrados | PARCIAL | Campos/formato y vencimiento OCR | Administración, vigencia y asociación |
| Compras/comprobantes | PARCIAL | CRUD, importes/imputaciones, asociados, soft delete | Cuadratura manual/update; unicidad BD; estados |
| Ventas | PARCIAL | CRUD, 10%, 5%, exentas | Asociados; integridad; unicidad independiente del cliente |
| Detalle por ítems | PENDIENTE | Solo cabecera con importes agregados | Decidir alcance; líneas si se requieren |
| Bolsa/revisión | PARCIAL | Lista, reclamo, correcciones a ocr_entrenamientos | Reclamo atómico, revisor, transiciones |
| Filtros | ROTO | `@Query() PaginacionDto` rechaza campos extra con pipe estricto | DTOs consultas compras/ventas/suscripciones/cuotas/asignaciones |
| Tesseract | PARCIAL | Motor real integrado | Fallos, concurrencia, precisión real |
| Vision | PARCIAL | Fallback integrado, confianza fija 99 | Credenciales, confianza real, degradación |
| Pipeline OCR | PARCIAL | R2/extracción/parseo/guardado síncronos HTTP | Idempotencia, transacciones, recuperación, background |
| Validación OCR | ROTO | Candidato sin número/timbrado puede aprobarse; fecha ausente -> hoy | Datos incompletos siempre revisión; advertencias |
| Padrón RUC | PARCIAL | `SetRuc` consultado; tabla configurada vacía | Carga y actualización; hoy razón social A CONFIRMAR |
| Imágenes/R2 | PARCIAL | Sharp WebP + PutObjectCommand | Acceso protegido, claves únicas, huérfanos |
| Entrenamiento OCR | PARCIAL | Guarda máquina y correcciones humanas | Consumidor/entrenamiento inexistente |
| IVA/RG90 | ROTO | CSV ventas fuerza 5%/exentas a cero; sin escape ni filtro de aptitud | Datos, formato y aceptación real |
| Suscripciones | PARCIAL | CRUD/estados/trial; guard busca canceladas | Vigencia, ausencia, trial, múltiples suscripciones |
| Planes | PENDIENTE | Sin tabla/entidad/servicio/endpoints | Catálogo, precios, vínculo |
| Límites | PENDIENTE | Sin consumo ni reglas | Contadores y aplicación manual/OCR |
| Cuotas/pagos | PARCIAL | CRUD manual | Montos/estados/pagos/deuda consistentes |
| Estado de cuenta | PENDIENTE | Relación cuotas cargada sin balance | Resumen deuda/pagos/vencimientos/saldo |
| Cuotas automáticas | PENDIENTE | Sin generador, renovación ni cron cobranza | Generación idempotente/ciclos/vencimientos |
| SMTP | PARCIAL | Bienvenida/reset integrados; contraseña en texto y BCC fijo | Invitaciones, retirar copia de secretos, reintentos |
| Auditoría | PENDIENTE | Timestamps/logs técnicos no son historial | Actor, operación, entidad, fecha, cambios |
| Redis | PENDIENTE | Sin integración ni dependencia directa | Infraestructura/configuración |
| BullMQ | PENDIENTE | Sin queue/producer/worker | Jobs/estado/reintentos/recuperación |
| Limpieza tokens | TERMINADO | TokenCleanupService registrado, cron diario | Monitoreo |
| Swagger | PENDIENTE | Sin paquete/config/OpenAPI | Contratos ejecutables |
| Docs API | PARCIAL | README/guías/endpoints extensos | Corregir contradicciones |
| BD/migraciones | PARCIAL | 21 tablas/21 entidades, columnas esperadas presentes; sin migraciones | Instalación reproducible e índices |
| Tests | ROTO | 24/31 suites unitarias fallan; e2e no arranca | Aliases/mocks/cobertura funcional |
| Errores | PARCIAL | Excepciones HTTP; traducción SQL limitada | Consistencia y recuperación parcial |
| Entornos | PARCIAL | ConfigModule/env sin validación integral | Obligatoriedad/opcionalidad por servicio |
| Seguridad global | ROTO | Escalada, acceso cruzado, hashes/secretos | Resolver antes del uso multicliente |
| Catálogos | PARCIAL | CRUD reales geográficos/tipos-documento | Administración y validación masiva |
| Servicios heredados | IMPLEMENTADO PERO NO INTEGRADO | TaxValidationService, sendCotizacionEmail, findOrCreateByEmail sin consumidores | Retirar/integrar; contraseña temporal fija en último |
| Frontend | FUERA DEL ALCANCE DE ESTA AUDITORÍA | No está en repo API | Ver FRONTEND_AUDIT.md y SYSTEM_STATE.md tras auditoría separada |

## P0 — Bloqueantes

1. Arranque local: `src/auth/strategies/google.strategy.ts:15` usa `?? 'NOT_CONFIGURED'`; variables Google existen vacías y no toman fallback. Constructor reproducido falla; `src/auth/auth.module.ts:33` registra estrategia obligatoriamente.
2. Instalación nueva no reproducible: README requiere `schema_bd_sis_iva.sql` pero `.gitignore:67` lo excluye. El backup versionado no tiene tablas de tokens, soft delete ni trial actuales; `synchronize:false` no los crea. La BD actual sí contiene esos campos.

## P1 — MVP

1. Permisos administrativos: `/menu-rol`, `/roles`, `/menu`, `/grupo-menu` solo JWT. Un autenticado puede concederse permisos. Evidencia `src/referenciales/parametros/menu-rol/menu-rol.controller.ts:19`.
2. Aislamiento: CRUD, bolsa y exportaciones no comprueban asignaciones por usuario/contribuyente. OCR sí.
3. Secretos: CRUD usuarios devuelve password hash; asignaciones carga usuarios relacionados. SMTP copia TODOS los correos a BCC fijo, incluidos reset tokens (`src/common/notifications/providers/smtp-email.provider.ts:19`). Bienvenida contiene contraseña en texto. No preservar valores de credenciales en estos documentos.
4. Filtros: reproducido pipe con `contribuyente_id`/`estado_ocr` -> 400 `property ... should not exist`. `src/common/dto/paginacion.dto.ts` solo tiene page/limit. Afecta compras, ventas, suscripciones, cuotas y asignaciones.
5. Integridad comprobantes: comprobación previa no atómica solo en altas manuales; OCR guarda directamente. BD actual sin índices únicos fiscales. Ventas incluye ruc_cliente en identidad de duplicado y permite repetir número/timbrado para otro cliente. Manual/update sin cuadratura/recalcular IVA; estados libremente editables.
6. OCR: `InvoiceParaguayValidatorService` mantiene candidato válido si faltan hasta dos datos; timbrado válido por defecto aun sin fechas. Caso `{ruc,total:11000,gravada10:11000}` sin número/timbrado devuelve candidato/matemática/timbrado válidos. Puede autoaprobarse según confianza. Fecha desconocida se sustituye por fecha actual. Padrón vacío -> A CONFIRMAR, sin forzar revisión por esa ausencia. R2, comprobante y cápsula no tienen atomicidad/compensación; R2 se escribe antes de validar.
7. RG90: caso venta total 37000 (11000 al 10%, 21000 al 5%, 5000 exento) exporta 5%/exento en cero. `src/negocio/exportaciones/services/rg90-builder.service.ts:114`. Exporta todos los estados, mantiene DV, deduce identificación por guion, no escapa `;`/saltos de línea. Guía describe 17 campos; código genera 14. No se certificó formato fiscal vigente.
8. Revisión/documentos/timbrados: reclamo lee y guarda sin atomicidad, dos revisores pueden reclamar; sin control de estados/revisor. PersonaDocumentosService plantilla y DTO vacío. Ventas sin comprobante/timbrado asociado. Definir gestión de timbrados.
9. SaaS: planes -> vigencia -> límites -> cuotas/pagos -> estado cuenta -> renovación. Guard solo busca canceladas: permite ausencia/morosidad; trial cancelado con fecha NULL evita condición SQL; cancelada histórica puede interferir con suscripción activa nueva. Definir política.
10. Pruebas de negocio: login/permisos/aislamiento/comprobantes/OCR/revisión/exportación/cobranza.

## P2 — Antes de producción

- Auditoría persistente de cambios contables, accesos administrativos, suscripciones y pagos.
- Rotación/consumo de tokens atómicos; revocación tras cambio/reset; usuarios inactivos.
- OAuth: vinculación identidad, callback sin access/refresh tokens en URL.
- ApiKeyGuard falla abierto si API_KEY y header están ausentes (reproducido: true).
- Redis/BullMQ para OCR, reintentos, idempotencia, estado y recuperación.
- R2 privado/protegido, claves únicas y compensación de imágenes huérfanas.
- SMTP con seguimiento y reintentos; hoy fire-and-forget con errores logueados.
- Errores de FK/duplicados, configuración validada, observabilidad.
- Swagger, documentación coherente, lint y CI.

## P3 — Optimización

- Reutilizar workers Tesseract y limitar concurrencia.
- Extraer pipeline compra/venta duplicado del controller.
- Optimizar eager/queries/índices/exportaciones grandes.
- Evaluar aprendizaje real desde correcciones; no existe actualmente.
- Retirar heredados/comentarios/any innecesarios.
- Corregir relación inversa de ComprobanteVenta: apunta a contribuyente.comprobantes (compras).

## Verificaciones y resultados

| Check | Resultado |
|---|---|
| Git árboles | Idénticos, a1 limpia |
| `tsc -p tsconfig.build.json --noEmit --incremental false` | Exit 0 |
| Nest build con salida/config TEMP | Exit 0, proyecto sin archivos generados |
| ESLint sin fix | 182 archivos; 1264 errores, 30 warnings; 1155 incidencias Prettier |
| Jest unitario runInBand/no-cache | 31 suites: 7 pasan, 24 fallan; 23 tests: 7 pasan, 16 fallan |
| Jest e2e runInBand/no-cache | 1 suite falla, 0 tests ejecutados: no resuelve src/gestion/usuarios/usuarios.service |
| BD SELECT metadatos | 21 tablas y 21 entidades; ninguna columna esperada ausente; no certifica igualdad completa de tipos/constraints |
| Menús BD | URLs alineadas con decorators API |
| Padrón | set_rucs vacío |
| Índices | Compras/ventas solo PK como índice único; no unicidad fiscal |
| Reproducciones aisladas | Filtros 400, OCR incompleto aprobado, CSV pierde importes/escape, Google vacío falla, API key ausente permite |

Tests fallan por aliases src/ sin resolver, dependencias/repositorios sin mocks (incluido MenuRolRepository en RolesService) y pais.controller.spec.ts contiene un controller y ningún test. La mayoría son smoke tests `should be defined`; no validan negocio. Lint también reporta tipado inseguro, variables sin uso y escapes regex. No se corrigió nada.

Configuración observada sin conservar secretos: DB/JWT/API_KEY/R2/SMTP presentes; GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET vacíos; CORS_ORIGIN y GOOGLE_APPLICATION_CREDENTIALS ausentes en .env. Esto último no demuestra ausencia de credenciales ADC por otros mecanismos. Node local 22.21.0; Nest instalado requiere >=20 mientras README dice 18+.

Corrección explícita: una actualización intermedia habló de 22 tablas siguiendo documentación; SELECT final confirma 21.

## Hallazgos adicionales y documentación

- No TODO/FIXME relevantes para los principales pendientes: defectos en código presentado como terminado.
- Método vacío googleAuth es intencional: redirige Passport.
- PersonaDocumentosModule registrado con servicio plantilla. Entidad PersonaDocumento sí consumida por personas/usuarios; no hay entidades completamente desconectadas identificadas.
- TaxValidationService no registrado como validador activo; activo es InvoiceParaguayValidatorService.
- sendCotizacionEmail y findOrCreateByEmail son heredados sin llamadas; último tiene password temporal fijo.
- EN_COLA, ERROR_PROCESAMIENTO, ENTRENADO solo estados; no workers/entrenamiento por existir esas cadenas.
- Docs equivocadas: concurrencia bolsa protegida, filtros funcionales, CRUD persona-documentos completo, RG90 exacto, 22 tablas.
- basededatos.md afirma pendiente limpieza tokens pero cron ya existe.
- El sistema implementa principalmente registro/lectura/exportación, no se comprobó emisión electrónica ni detalle por ítems.

## Roadmap propuesto original (API, sujeto al cruce frontend)

1. Arranque/config Google opcional.
2. Esquema/migraciones/bootstrap reproducible, sin credenciales fijas.
3. Infraestructura tests: aliases/mocks/suite vacía.
4. Permisos administrativos y aislamiento de contribuyentes.
5. Secretos y sesiones.
6. DTOs filtros/contratos HTTP.
7. Documentos, normalización y timbrados/asociados ventas.
8. Reglas unificadas comprobantes e índices integridad.
9. OCR y carga padrón.
10. Bolsa atómica/autorizada.
11. RG90 correcto y validado.
12. Planes/vigencia suscripción.
13. Límites de consumo concurrentes.
14. Cuotas/pagos/estado cuenta.
15. Cuotas/renovaciones automáticas idempotentes.
16. Auditoría.
17. Redis/BullMQ/R2/SMTP robustos.
18. Swagger/documentación/lint/CI.
19. Optimización y retiro heredados.

No ejecutar automáticamente. El roadmap actualizado del sistema está en TASKS.md.
