# ROADMAP DEL SISTEMA COMPLETO

Actualizado: 2026-10-31. Auditoría y cruce terminados. Roadmap reordenado según la revisión aprobada `CLAUDE_ROADMAP_REVIEW.md`. Implementación NO autorizada salvo pedido explícito por tarea. No commit/push.

Base: API_AUDIT/API_STATE del 2026-09-26 y FRONTEND_AUDIT del 2026-09-30. `Fxx` identifica un hallazgo frontend; `API P1.n` un hallazgo de API_AUDIT; `Rn` un riesgo de CLAUDE_ROADMAP_REVIEW. Las tareas marcadas `[x]` ya fueron implementadas y verificadas (P0.1–P0.6d, P1a.1, P1a.5a, P1b.1–P1b.3); las marcadas `[ ]` siguen pendientes y el orden no equivale a aprobación.

Convenciones por tarea:
- `Depende de:` tareas que deben estar terminadas antes.
- `Decisión:` decisiones de producto requeridas. Si alguna está PENDIENTE, la tarea no se inicia.
- `Aceptación:` criterio verificable para cerrarla.

## Auditoría completada

- [x] Leer documentos persistidos sin repetir auditoría API.
- [x] Revisar frontend y cruzarlo con esa base.
- [x] Crear FRONTEND_AUDIT.md y SYSTEM_STATE.md.
- [x] Consolidar roadmap del sistema.
- [x] Revisión crítica del roadmap (CLAUDE_ROADMAP_REVIEW.md) aprobada.

## DECISIONES DE PRODUCTO

| # | Decisión | Estado | Bloquea |
|---|---|---|---|
| D1 | Usuarios con login | DEFINIDA | Aislamiento, login BFF, bolsa |
| D2 | Google OAuth | DEFINIDA | P0.1, P1a.7 |
| D3 | Endpoints administrativos y bootstrap | DEFINIDA | P0.6, P1a.1 |
| D4 | Persona-documentos: CRUD independiente o solo gestión anidada en personas | PENDIENTE | P1b.5 |
| D5 | Clave fiscal de duplicado en compras y ventas (ventas sin `ruc_cliente`) y tratamiento de duplicados existentes | PENDIENTE | P1c.4–P1c.6 |
| D6 | Máquina de estados de comprobantes | DEFINIDA | P1c.2, P1d.7, P1d.11 |
| D7 | Timbrados: entidad administrada por contribuyente o solo campos; si la vigencia bloquea o advierte | PENDIENTE | P1c.9 |
| D8 | Especificación RG90 vigente (campos, tipo de identificación, DV) y archivo de ejemplo aceptado por Marangatu | PENDIENTE | P1d.9–P1d.10 |
| D9 | Fuente y frecuencia de actualización del padrón SET de RUC | PENDIENTE | P1d.2 |
| D10 | Acceso a imágenes en R2 (bucket privado, URLs firmadas, TTL) | PENDIENTE | P1d.4, P1d.7 |
| D11 | Primera etapa: servicio gestionado sin cargo para los clientes, con LIBRE total. Después: sistema de autoservicio pagado; cuota y medición por definir. FREE con límites, precios y demás condiciones pendientes | PARCIAL | Fase SaaS |
| D12 | Volumen esperado de OCR (define si hace falta cola) | PENDIENTE | P2.10 |
| D13 | Respuesta a exposición histórica de secretos: qué se rota o revoca | PENDIENTE | P1a.4 |
| D14 | Registro/exportación o emisión electrónica; detalle por ítems | PENDIENTE | P3.7 |
| D15 | Alcance del dashboard | PENDIENTE | P3.4 |
| D16 | Membresía usuario–empresa | DEFINIDA | MIGRACIÓN MULTIEMPRESA |
| D17 | Sin equipos — REEMPLAZADA 2026-10-31: sin equipos; permisos (rol por membresía) y clientes asignados por usuario | REEMPLAZADA | MIGRACIÓN MULTIEMPRESA |
| D18 | Contribuyente global + cartera empresa_contribuyente | DEFINIDA | MIGRACIÓN MULTIEMPRESA |
| D19 | Tenant en comprobantes | DEFINIDA | MIGRACIÓN MULTIEMPRESA |
| D20 | Etapas comerciales: gestión inicial sin cargo con LIBRE total; futura operación directa con acceso pagado. Unidad y medición de la cuota pendientes | PARCIAL | Fase SaaS |
| D21 | Dataset QA multiempresa (dataset sin equipos; ver TENANCY_COMMERCIAL_MODEL.md) | DEFINIDA | MIGRACIÓN MULTIEMPRESA |
| D22 | Administrador Plataforma vs Administrador Empresa | DEFINIDA | P0.6d, MIGRACIÓN MULTIEMPRESA |
| D23 | Motor objetivo MariaDB 11.8.x | DEFINIDA | P0.6b |
| D24 | Unión de empresas: fusión real o gestión conjunta | PENDIENTE (Q2) | MIGRACIÓN MULTIEMPRESA |

### D1 — Usuarios con login (DEFINIDA)

- En el MVP pueden iniciar sesión Administrador, Contador y Solo Lectura.
- El contribuyente NO tiene usuario ni login propio en esta etapa.
- El acceso a datos respeta el rol y las asignaciones contables correspondientes.

### D2 — Google OAuth (DEFINIDA)

- Se mantiene en el proyecto.
- NO auto-crea usuarios. Solo autentica usuarios que ya existen en el sistema.
- El email devuelto por Google debe corresponder a un usuario existente y el usuario debe estar activo. Si no existe, se rechaza el login.
- El usuario conserva el rol ya asignado.
- Por ahora NO se configuran credenciales Google en ningún entorno.
- P0 solo garantiza que la API arranque sin Google configurado. La integración completa va después de cerrar permisos (P1a.1) y sesiones (P1a.5).

### D3 — Endpoints administrativos (DEFINIDA)

- `/roles`, `/menu`, `/grupo-menu` y `/menu-rol` quedan restringidos explícitamente a Administrador.
- Contador y Solo Lectura no pueden modificar la estructura de permisos.
- MenuRolGuard sigue aplicándose al resto de funcionalidades.
- El primer administrador se crea mediante seed/bootstrap controlado, nunca con credenciales fijas documentadas.

### D6 — Máquina de estados de comprobantes (DEFINIDA)

Estados operativos de `estado_ocr`: `AUTO_PROCESADO`, `REQUIERE_REVISION`, `PROCESANDO`, `VERIFICADO_HUMANO`, `ERROR_PROCESAMIENTO`.

| Estado | Quién lo asigna / cómo | Exportable RG90 |
|---|---|---|
| `AUTO_PROCESADO` | Solo el sistema, cuando OCR + validaciones obligatorias pasan. A futuro puede entrar en muestreo aleatorio de control humano. | Sí |
| `REQUIERE_REVISION` | El sistema, ante datos obligatorios faltantes, inconsistencias, confianza insuficiente, validación fiscal dudosa o cualquier condición no segura para autoaprobación. | No |
| `PROCESANDO` | Solo mediante la acción de reclamar desde la bolsa; queda asociado a un revisor responsable. | No |
| `VERIFICADO_HUMANO` | Solo mediante una acción explícita de confirmar/corregir de un usuario autorizado; nunca por PATCH libre de `estado_ocr`. | Sí |
| `ERROR_PROCESAMIENTO` | Solo errores técnicos reales del pipeline OCR/procesamiento. | No |

Transiciones permitidas:
- Pipeline OCR (sistema) → `AUTO_PROCESADO` | `REQUIERE_REVISION` | `ERROR_PROCESAMIENTO`.
- `REQUIERE_REVISION` → `PROCESANDO`: acción reclamar, que asigna el revisor responsable.
- `PROCESANDO` → `VERIFICADO_HUMANO`: acción confirmar/corregir de un usuario autorizado, con validaciones aprobadas.
- `AUTO_PROCESADO` → `VERIFICADO_HUMANO`: edición manual de datos fiscales relevantes que vuelve a pasar las validaciones y es confirmada por un usuario autorizado.
- `VERIFICADO_HUMANO` → `VERIFICADO_HUMANO`: corrección por un usuario autorizado con validaciones aprobadas. La trazabilidad fina queda para la auditoría persistente (P2.1).

Reglas:
- El frontend NO puede modificar `estado_ocr` arbitrariamente; los cambios ocurren solo por las acciones anteriores.
- Exportables: únicamente `AUTO_PROCESADO` y `VERIFICADO_HUMANO`. `REQUIERE_REVISION`, `PROCESANDO` y `ERROR_PROCESAMIENTO` nunca se exportan.
- `EN_COLA` queda reservado para un posible procesamiento asíncrono futuro; mientras el OCR siga siendo síncrono no forma parte del flujo normal.
- NO existe `EXPORTADO` como `estado_ocr`: la exportación es un evento o proceso separado y puede repetirse.
- `ENTRENADO` y `LISTO_PARA_ENTRENAR` NO son estados del comprobante; pertenecen al ciclo del dataset de entrenamiento OCR. No mezclar ambos ciclos.
- Solo un registro confirmado o corregido por una persona puede ser ground truth de entrenamiento.
- Para entrenamiento futuro de una IA propia/open source debe preservarse conceptualmente: imagen o referencia, texto OCR original, motor/proveedor, versión del modelo si aplica, confianza, JSON predicho, JSON confirmado/corregido, campos corregidos, usuario verificador y fecha de verificación.

Aspectos que D6 no cubre (definirlos antes de implementarlos; no inventarlos):
- Liberación o vencimiento de un `PROCESANDO` reclamado y no resuelto.
- Reprocesamiento de `ERROR_PROCESAMIENTO`.
- Resultado de una edición o corrección que no pasa las validaciones.
- Estado inicial de un comprobante cargado manualmente, sin OCR.
- Mecánica del muestreo aleatorio de `AUTO_PROCESADO`.

### D16 a D21 — Multitenancy y Modelo de Empresa (DEFINIDAS / EN REVISIÓN)

- **D16 (Membresía usuario-empresa):** Un usuario pertenece a una o múltiples empresas (tenant raíz). Objetivo ya definido; no requiere preguntar nuevamente al usuario.
- **D17 (Sin equipos — REEMPLAZADA 2026-10-31):** Sin equipos ni `equipo_miembros`. El acceso granular se asigna por usuario mediante su rol en la membresía (`Administrador` / `Contador` / `Solo Lectura`) y las asignaciones de clientes (contribuyentes) por usuario dentro de la cartera de su empresa (D18). El usuario no pidió overrides individuales de permisos sobre el rol (`menu_rol`); cualquier detalle técnico de permisos finos queda como pendiente de diseño técnico en `MIGRACIÓN MULTIEMPRESA` sin nuevas preguntas al usuario. *(Histórico P0.6a reemplazado: antes contemplaba equipos dentro de la empresa).*
- **D18 (Contribuyente global + cartera empresa_contribuyente):** El contribuyente existe globalmente, pero la relación con la empresa se gestiona mediante una tabla pivot (`empresa_contribuyente`).
  - Restricción: ningún modo comercial (incluido LIBRE) ni coincidencia de email, alias o RUC habilita acceso entre empresas.
- **D19 (Tenant en comprobantes):** Todo comprobante debe estar asociado explícitamente al tenant (empresa) para garantizar aislamiento de datos en consultas.
  - Restricción: ningún modo comercial (incluido LIBRE) ni coincidencia de email, alias o RUC habilita acceso entre empresas.
- **D20 (Etapas comerciales):** servicio inicial gestionado sin cargo en `LIBRE` total; futura operación directa pagada. Cuota y unidad de medición se definen en Q1/D11 antes de activar cobros.
- **D21 (Dataset QA multiempresa):** QA debe probarse con seed multiempresa sin equipos, administradores/contadores A y B y asignaciones de clientes por usuario. El seed inicial usa `LIBRE` total; los escenarios de cobro futuro quedan para después de Q1/D11.

### D22 — Administrador Plataforma vs Empresa (DEFINIDA)

- **Administrador de Plataforma:** Gestión global de roles y menús, y propietario de la plataforma que concede el modo comercial `LIBRE`.
- **Administrador de Empresa:** Limitado a gestionar operaciones dentro de su tenant; no altera permisos del sistema.

### D23 — Motor objetivo MariaDB 11.8.x (DEFINIDA)

- El desarrollo y las migraciones apuntan explícitamente a MariaDB 11.8.x para estar en paridad con QA (Hostinger) y producción. MySQL 8 queda documentado como motor histórico local.

### D11 (parcial) y D24 — Modos comerciales y unión de empresas

Detalle consolidado en `.ai-work/TENANCY_COMMERCIAL_MODEL.md`.

**Modos comerciales confirmados por el usuario (D11 parcial):**
- **PAGO**: modo comercial sujeto a cobro (planes, precios, períodos, trial, morosidad y renovación pendientes en D11).
- **LIBRE**: primera etapa de gestión de clientes sin cargo y sin límites comerciales; lo concede el propietario de la plataforma (Administrador de Plataforma, D22); **no anula** el aislamiento por empresa (D18/D19).
- **FREE**: posible modo gratuito con límites de consumo para una oferta futura (cupos, valores y períodos siguen pendientes en D11; prohibido inventarlos). No describe el servicio gestionado inicial.
- **PAGO**: futura modalidad para quienes operen directamente el sistema; el usuario indicó que esa operación deberá ser pagada. Se evaluará una cuota vinculada a quienes cargan facturas, sin decidir todavía periodicidad, precio ni medición exacta.

El producto tendrá dos etapas sobre la misma plataforma: (1) al inicio, el equipo del propietario gestiona documentos y facturas que entregan sus clientes, sin cobrarles el uso del sistema; (2) luego, otras personas o empresas podrán alquilar/usar directamente el sistema, con acceso pagado. La cuota exacta y su unidad se definirán antes de activar pagos. No se asume que el sistema emita factura fiscal electrónica.

**Decisiones comerciales y de unión pendientes para fases posteriores:**

| # | Pregunta al usuario | Estado | Bloquea |
|---|---|---|---|
| Q1 | Regla comercial futura: cuota por usuario que carga facturas, por empresa u otra medición | **APLAZADA** hasta definir el SaaS pagado | Fase SaaS; no bloquea gestión inicial sin cargo, multiempresa ni aislamiento |
| Q2 | "Unir empresas", ¿es una **fusión real** de datos (A absorbe a B) o una **gestión conjunta** (un usuario opera ambas y cada una conserva sus datos)? | **PENDIENTE** | D24 propuesta, recorrido QA de la unión de empresas |
| Q3 | Alcance de la solicitud | **RESPONDIDA** por el pedido de completar instalación limpia, configuración, migración y recorrido local | Autoriza trabajo en entorno local aislado; no autoriza cambios en QA/producción |

*Nota sobre las observaciones Q4–Q7 del análisis de Claude (no constituyen nuevas preguntas bloqueantes al usuario):*
- **Q4 (resuelta por el usuario — no pendiente):** El Administrador de Plataforma concede `LIBRE` total para el servicio gestionado inicial, sin costo de uso del sistema y sin límites comerciales.
- **Q5 (resuelta por el usuario / diseño técnico — no pregunta al usuario):** El usuario definió roles (`Administrador`/`Contador`, más `Solo Lectura` de D1) y asignaciones de clientes por usuario **sin equipos**, sin pedir overrides individuales de permisos sobre el rol (`menu_rol`). Si hiciera falta algún detalle técnico de permisos finos, se documenta como **pendiente de diseño técnico** en `MIGRACIÓN MULTIEMPRESA`, sin abrir nuevas preguntas al usuario.
- **Q6 (cubierta por D16 definida — no pendiente):** La membresía multiempresa (usuarios distintos en A y B y/o un mismo usuario con membresía en múltiples empresas) ya es el modelo objetivo definido en **D16** y no requiere preguntar nuevamente.
- **Q7 (integrada en D11 PENDIENTE):** Los límites, cupos y períodos del modo `FREE` futuro permanecen pendientes dentro de **D11** sin inventar valores.

**Unión de empresas (D24 — PENDIENTE por Q2) — requisitos previos obligatorios antes de ejecutar:**
1. **Plan de no-conflictos aprobado**: resolución para RUC presentes en ambas carteras, usuarios con membresía en ambas empresas, roles divergentes, asignaciones contables duplicadas y modos comerciales o suscripciones distintas (depende de Q1/D11). Para comprobantes que pudieran colisionar, la regla fiscal de duplicado es **D5 (PENDIENTE)**: el plan solo inventariaría las categorías de conflicto, sin decidir política de duplicados.
2. **Inventario de referencias** que apuntan a la empresa o a su cartera: comprobantes (`comprobantes` compras y `comprobantes_ventas`), `asignaciones_contables`, `suscripciones` y `cuotas`, `ocr_entrenamientos` y claves de objetos en R2 (**D10 PENDIENTE**).
3. **Auditoría (P2.1)**: registro de quién ejecutó la unión, cuándo, el mapeo `origen → destino` y la conservación del identificador de cada operador histórico.
4. **Pruebas y reversión**: simulación en una BD temporal local aislada con conteos antes y después, verificación de aislamiento frente a terceros y criterio de reversión definido **antes** de ejecutar.
5. **Restricción de entorno**: nunca en QA ni en producción sin una tarea separada y autorizada.

## Orden de fases

Fase 0 (decisiones) → P0 → P1a → P1b → P1c → P1d → P1e → P2 → Fase SaaS → P3.

D1, D2, D3 y D6 están definidas. Las decisiones pendientes se resuelven antes de la tarea que bloquean.

## P0 — Arranque, contención y base de trabajo

- [x] **P0.1** API: arranque seguro sin Google. Registrar la estrategia solo cuando las variables estén configuradas (hoy las variables vacías no toman el fallback y el constructor falla). No configurar credenciales.
  Decisión: D2.
  Aceptación: la API arranca con variables Google vacías o ausentes, y los endpoints OAuth no quedan operativos sin configuración.
- [x] **P0.2** Cortar fugas activas: quitar el BCC fijo del SMTP, los logs F01 (respuesta de login con tokens; password en el alta de usuario) y la contraseña en texto del email de bienvenida (API P1.3, F01).
  Aceptación: payloads, logs y emails simulados sin secretos.
- [x] **P0.3** API: ApiKeyGuard fail-closed y login que rechaza usuarios inactivos.
  Aceptación: sin `API_KEY` configurada o sin header → 401; un usuario inactivo no recibe tokens.
- [x] **P0.4** Frontend: plantilla de entorno sin secretos e instrucciones de BFF, BD local, sesiones, API URL y key (F12).
  Aceptación: la instalación no depende de un `.env.example` inexistente.
- [x] **P0.5a** Tests API: resolver aliases `src/` (`moduleNameMapper`) y el arranque de e2e.
  Aceptación: las suites restantes cargan sin errores de resolución.
- [x] **P0.5b** Tests API: eliminar los smoke tests `should be defined` sin valor y la spec vacía de país, en lugar de mockear 24 suites.
  Depende de: P0.5a.
- [x] **P0.5c** Tests BFF: base con `Http::fake` + `preventStrayRequests`, y desactivar el scaffolding Breeze que no aplica (registro local, `/profile`).
  Aceptación: la suite BFF no genera tráfico externo real.
- [x] **P0.6a** Schema: baseline versionado desde la BD actual (21 tablas, sin datos ni credenciales).
  Aceptación: una instalación vacía alcanza el esquema actual sin `synchronize` automático.
- [x] **P0.6b** Tooling de migraciones TypeORM. Todas las tareas que cambian el schema dependen de esta.
  Depende de: P0.6a.
- [x] **P0.6c** Seed de roles, grupos, menús y `menu_rol` con las URLs vigentes (no las del SQL histórico).
  Depende de: P0.6a.
  P0.6c COMPLETADO (2026-10-02, revisado y aprobado por Claude). `npm run seed:catalogs`: 3 roles, 5 grupos, 17 menús, 37 `menu_rol`; idempotente; idéntico a QA. Detalle en `SEED_CATALOGS.md` y `SYSTEM_STATE.md`.
- [x] **P0.6d** Bootstrap controlado del primer Administrador (variable de entorno o CLI), sin credenciales fijas.
  Depende de: P0.6c. Decisión: D3, D22.
  Estado 2026-10-08 10:44 -03:00: checkpoint final Codex → **APROBADO**. Principal completada.
  - [x] BLOCKER (Claude, verificado integración ciclo 1): hash explícito bcrypt 10 en bootstrap, incluido plaintext con prefijo `$2b$`; verificar desigualdad y compare.
  - [x] IMPORTANTE (Claude, verificado ciclo 1): parser puro tipado; validación/normalización y no-op admin activo sin evaluar email suministrado.
  - [x] IMPORTANTE (Claude, verificado integración ciclo 1): rollback solo con transacción activa; conservar error previo real.
  - [x] IMPORTANTE (Claude, verificado ciclo 2): tests de configuración, persistencia/fallos, hash y logs (37/37); validación real temporal + cleanup (90/0, `tmp_dbs_restantes=0`, `bd_sis_iva` sin cambios).
  - [x] IMPORTANTE (Claude, verificado ciclo 2): BOOTSTRAP_ADMIN.md actualizado (incl. política de logs) y deuda del hook registrada como P1a.9 sin implementarla.
  - [x] IMPORTANTE (Claude, verificado integración ciclo 2): logs solo con categoría de allowlist (`sanitizeErrorCategory`) en lib y runner; 0 fugas, R2 verificado en runtime (ER_ACCESS_DENIED_ERROR / ER_BAD_DB_ERROR sin datos).
  Trazabilidad detallada: `.ai-local/ORCHESTRATOR_HISTORY.md` y revisión/instrucciones Claude; principal permanece pendiente hasta Agy + Claude APROBABLE + checkpoint Codex.
  Hallazgo Codex posterior a AGY (IMPORTANTE, pendiente Claude): logs de `bootstrap-admin.ts` aún incorporan `error.message` para errores distintos de QueryFailedError; runner emite code/name arbitrarios. Verificar ausencia de secretos en todos esos campos antes de aprobar C7.
  Ciclo 1 — instrucciones Claude a AGY: `.ai-local/P0_6D_AGY_CORRECTIONS.md` (2026-10-08). Reviewer: Claude. C1/C2/C3/C5/C6 verificados ciclo 1; C4 parcial y C7 rechazado en ciclo 1 → ambos verificados en ciclo 2 (vía R1–R4).
  | # | Sev. | Problema | Archivo | Cambio | Test | Resultado |
  |---|---|---|---|---|---|---|
  | C1 | BLOCKER | Hash delegado al hook; plaintext `$2b$` queda sin hashear | `bootstrap-admin.ts` | `bcrypt.hash(pw,10)` explícito antes de save | hash≠plain, compare, prefijo `$2b$` | verificado en ciclo 1/2 |
  | C2 | IMPORTANTE | `config:any`; validación en runner no testeable; nombre/apellido sin trim | `bootstrap-admin.config.ts` (nuevo), runner | parser puro tipado; config inválida→exit 1 antes de BD; admin activo→no-op sin evaluar email | `bootstrap-admin.config.spec.ts` | verificado en ciclo 1/2 |
  | C3 | IMPORTANTE | Rollback incondicional enmascara error pre-transacción | `bootstrap-admin.ts` | rollback solo si `isTransactionActive`; conservar error original | pre-tx, fallo rollback | verificado en ciclo 1/2 |
  | C4 | IMPORTANTE | Cobertura insuficiente | `*.spec.ts` | casos de config, persistencia, hash, logs | ver instrucciones §3 | verificado en ciclo 1/2 |
  | C5 | IMPORTANTE | Doc describe hash vía hook; ejemplo con contraseña literal | `BOOTSTRAP_ADMIN.md` | §4 instrucciones | revisión doc | verificado en ciclo 1/2 |
  | C6 | IMPORTANTE | Deuda bypass del hook en alta normal | `TASKS.md` | registrar P1a.9 sin implementar | n/a | verificado en ciclo 1/2 |
  | C7 | MENOR | Lib escribe `process.exitCode`; logs con `error.message` crudo y email | `bootstrap-admin.ts` | outcome tipado + `outcomeToExitCode`; log sanitizado | logs spec | verificado en ciclo 1/2 |
  Revisión Claude ciclo 1 (2026-10-08 09:51 -03:00): **RECHAZADO** (`.ai-local/P0_6D_CLAUDE_REVIEW.md`). Jest seeds 22/22 PASS, build OK, integración en BD temporal local 57 PASS / 8 FAIL, cleanup confirmado. C1, C2, C3, C5 y C6 verificados OK en BD real. C4 parcial; C7 FALLA: 8/10 sondas filtran secretos vía message/code/name (confirma el hallazgo de Codex).
  Ciclo 2 — instrucciones a AGY: `.ai-local/P0_6D_AGY_CORRECTIONS_CYCLE2.md`.
  | # | Sev. | Problema | Archivo | Test | Resultado |
  |---|---|---|---|---|---|
  | R1 | IMPORTANTE | catch loguea message/code/name arbitrarios (fuga) | `bootstrap-admin.ts` | it.each 11 sondas + sanitizer | verificado ciclo 2 |
  | R2 | IMPORTANTE | runner loguea code/name arbitrarios | `run-bootstrap-admin.ts` | sanitizer compartido | verificado ciclo 2 |
  | R3 | IMPORTANTE | test de logs no pone el secreto en message/code/name | `bootstrap-admin.spec.ts` | §tests ciclo 2 | verificado ciclo 2 |
  | R4 | MENOR | no-op no prueba ausencia de consulta `{email}` | `bootstrap-admin.spec.ts` | not.toHaveBeenCalledWith | verificado ciclo 2 |
  | R5 | MENOR | doc sin política de logs | `BOOTSTRAP_ADMIN.md` | revisión doc | verificado ciclo 2 |
  Revisión Claude ciclo 2 (2026-10-08 10:00 -03:00): **APROBABLE** (`.ai-local/P0_6D_CLAUDE_REVIEW.md`). Observación MENOR no bloqueante O1: el sanitizador lee `code`/`name` varias veces (un getter inestable sintético filtra; no aplica a errores reales); decisión de Codex arreglar ya o registrar deuda. Siguiente: checkpoint Codex.
  Checkpoint Codex 2026-10-08 10:16:37 -03:00: NO aprobado aún. O1 confirmado en prueba independiente `.ai-local/p06d_codex_checkpoint.cjs`: getter code/name inestable devuelve valor sintético no permitido; 3 lecturas por campo. Corrección Claude O1 a AGY ciclo 3: snapshot único de cada campo + tests; no ampliar alcance.
  Ciclo 3 — AGY implementa corrección O1 autorizada por Codex (snapshot de getter y tests confirmatorios). Jest seeds/build OK, `p06d_codex_checkpoint.cjs` PASS. Pendiente revisión final Claude.
  | # | Sev. | Problema | Archivo | Test | Resultado |
  |---|---|---|---|---|---|
  | O1 | MENOR | sanitizador lee `code`/`name` varias veces; getter inestable filtra | `bootstrap-admin.ts` | `bootstrap-admin.spec.ts` getters inestables code/name + `p06d_codex_checkpoint.cjs` | verificado ciclo 3 (2026-10-08): 1 lectura por campo, 0 fugas |
  Revisión Claude ciclo 3 (2026-10-08 10:34:22 -03:00): **APROBABLE** (`.ai-local/P0_6D_CLAUDE_REVIEW.md`). Jest seeds 39/39, build exit 0, checkpoint Codex PASS (`codeReads=1`, `nameReads=1`, sin fuga). Sin nueva integración BD (cambio limitado al sanitizador, integración 90/0 de ciclo 2 vigente). TASKS.md re-codificado de Windows-1252 a UTF-8 sin cambiar caracteres. Siguiente: checkpoint final Codex; principal sigue `[ ]` hasta ese checkpoint.
- [ ] **MIGRACIÓN MULTIEMPRESA** (trabajo iniciado; desglose y aceptación por bloque abajo). Modificaciones al modelo de BD y lógica base para soportar el Tenant Raíz (D16-D22).
  Depende de: P0.6b.
  Ajuste 2026-10-31: sin equipos (D17 reemplazada por rol en membresía y clientes asignados por usuario; cualquier ajuste técnico de permisos finos queda como pendiente de diseño técnico si fuera necesario, sin nuevas preguntas al usuario). Servicio inicial gestionado sin cargo y LIBRE total; futura operación directa pagada, con unidad/cuota pendiente (Q1, que no bloquea el tenant base). Q2/D24 (fusión real o gestión conjunta) solo bloquea la función de unión, no la base multiempresa. El usuario pidió completar instalación limpia, configuración, migración y recorrido local (Q3 respondida); solo entorno local aislado, sin QA/producción.
  - [ ] **M0 — Esquema inicial instalable**: migración versionada MariaDB 11.8 para instalar desde cero las 21 tablas existentes y revertir en orden seguro. Aceptación: ejecutar/revertir/reaplicar en BD MariaDB temporal vacía y contrastar con entidades/inventario. Estado: implementación estática creada por Codex tras bloqueo de AGY; cotejo DDL 21/21 y revisión Claude APROBABLE con I1/I2 remediadas (segunda revisión pendiente). No marcar completo hasta aceptación runtime MariaDB 11.8.
  - [ ] **M1 — Modelo tenant**: empresas, membresía usuario–empresa con rol, cartera empresa–contribuyente, asignaciones de clientes acotadas a empresa y tenant en comprobantes; estrategia para datos existentes. Q2 no bloquea este bloque.
  - [ ] **M2 — API y aislamiento**: contexto empresa y autorización en endpoints de contribuyentes, asignaciones, compras, ventas, OCR y exportaciones; pruebas negativas A↔B.
  - [ ] **M3 — BFF y frontend**: login de Contador/Solo Lectura, selector/contexto de empresa, rol/navegación y contexto persistente en consultas/escrituras.
  - [ ] **M4 — Instalación y recorrido local**: semillas reproducibles, bootstrap plataforma/empresas, instalación limpia y E2E con A/B; no QA/producción.
  Estado actual 2026-11-01: Claude completó análisis y revisión estática inicial; AGY no entregó implementación y su revisión agotó el tiempo. Codex creó `src/database/migrations/1793498913511-InitialSchema.ts`: DDL estático de 21 tablas cotejado con inventario y baseline histórico, ordenado por FK; `up` acepta solo MariaDB 11.8.x, exige `explicit_defaults_for_timestamp=ON` y aborta si encuentra objetos previos salvo `migrations`; `down` solo borra las 21 tablas vacías en orden inverso. Claude primera revisión APROBABLE; I1 (guía) e I2 (timestamp mode) atendidas, pero revisión de la corrección no obtenida (ECONNREFUSED). Checker estático ampliado PASS (21 tablas/DDL, orden FK y guards); TypeScript diagnostics del archivo 0. Docker Desktop se inició y la imagen `mariadb:11.8` se descargó; `docker info` respondió con permisos elevados. No se creó contenedor/BD ni se ejecutó migración; la continuación se dejó para mañana por pedido del usuario. MySQL 8 no sustituye MariaDB. Entidades difieren del inventario (aprox. 6 UNIQUE y 29 índices, precisión temporal, ON UPDATE, FK names); queda expresamente pospuesto por el usuario y no bloquea M0. No usar `migration:generate` ni auto-adoptar bases por huella; M0 exige BD local realmente vacía. DDL MariaDB no es transaccional; ante fallo parcial, descartar y recrear solo la BD temporal. Ver `.ai-work/README_M0.md`; M0 runtime y M1–M4 siguen pendientes.
- [ ] **P0.7** Docs versionados: quitar credenciales de `CLAUDE.md` y demás docs, y marcar las afirmaciones refutadas apuntando a `.ai-work` (R6, R7). La rotación de esas credenciales va en P1a.4. (corregido ciclo 2, pendiente revisión Claude)
  Depende de: P0.6d. Decisión: ninguna nueva (D13 solo bloquea la rotación, P1a.4).
  Aceptación: escáner `.ai-local/p07_doc_scan.ps1` sin `CRED_PAIR`/`CLI_PASSWORD`, `JSON_PASSWORD` solo placeholders (0 literales); 0 reusos de las credenciales documentadas en HEAD; banners + marcas "Corregido P0.7" con puntero a `.ai-work`; solo 6 `.md` modificados; UTF-8 sin BOM/LF sin mojibake.
  Estado 2026-10-08 10:57 -03:00: instrucciones Claude a AGY en `.ai-local/P0_7_AGY_INSTRUCTIONS.md`. Implementador: AGY. Reviewer: Claude. Hashes base 6/6 MATCH.
  Inventario versionado: `CLAUDE.md`, `README.md`, `SISTEMA_IVA_GUIA.md`, `API_ENDPOINTS.md`, `GOOGLE_OAUTH_SETUP.md`, `basededatos.md` (+ `schema_bd_sis_iva.backup.sql`, histórico, no se edita). Valores nunca copiados; solo archivo/línea/categoría en las instrucciones.
  | # | Sev. | Problema | Archivo(s) | Resultado |
  |---|---|---|---|---|
  | S1–S6 | BLOCKER | Credencial admin inicial / usuario demo en texto (6 ubicaciones en 4 docs) | CLAUDE, README, SISTEMA_IVA_GUIA, API_ENDPOINTS | implementado, pendiente revisión Claude |
  | S7 | IMPORTANTE | Contraseñas literales en bodies JSON de ejemplo (10 líneas) | API_ENDPOINTS, SISTEMA_IVA_GUIA | implementado, pendiente revisión Claude |
  | S8–S10 | IMPORTANTE/MENOR | Cuenta SMTP real; `mysql -p<pw>` en CLI; muestra de token | CLAUDE, README, SISTEMA_IVA_GUIA, GOOGLE_OAUTH_SETUP | implementado, pendiente revisión Claude |
  | C1 | BLOCKER | CLAUDE.md sin precedencia de `.ai-work` | CLAUDE | implementado, pendiente revisión Claude |
  | C2–C3 | BLOCKER/IMPORTANTE | OAuth auto-crea usuarios y tokens en URL presentados como diseño (contradice D2; código aún auto-crea → P1a.8a/b) | CLAUDE, GOOGLE_OAUTH_SETUP, SISTEMA_IVA_GUIA, API_ENDPOINTS | implementado, pendiente revisión Claude |
  | C4 | BLOCKER | Instalación vía SQL histórico (seed URLs viejas, admin fijo) → retirar; baseline 21 tablas + seed 37 `menu_rol` + bootstrap | CLAUDE, README, SISTEMA_IVA_GUIA | implementado, pendiente revisión Claude |
  | C5–C6 | IMPORTANTE | "Estado final/100 % sincronizado/22 tablas/MySQL 8 listo"; migrations "aplicadas" (carpeta vacía) → D23 MariaDB 11.8, P0.6b | CLAUDE, README, SISTEMA_IVA_GUIA, basededatos | implementado, pendiente revisión Claude |
  | C7–C11 | IMPORTANTE | Bolsa concurrente, RG90 exacto, estados D6, filtros/paginación/persona-documentos, endpoints admin solo JWT → refutados con puntero a P1a/P1b/P1c/P1d | CLAUDE, API_ENDPOINTS, SISTEMA_IVA_GUIA, basededatos | implementado, pendiente revisión Claude |
  | C12–C16 | MENOR | Correcciones P0.2/P0.3, API_KEY fail-closed, multiempresa/Redis/Swagger pendientes, docs de referencia históricos | CLAUDE, README, API_ENDPOINTS | implementado, pendiente revisión Claude |
  Observaciones (no P0.7): `.ai-work/` no versionado (decisión del usuario); exposición en historial Git persiste → rotación P1a.4 (D13); contraseña fija en `findOrCreateByEmail` ya en P3.3.
  Review Claude ciclo 1 — 2026-10-08 11:14:33 -03:00: **RECHAZADO** (`.ai-local/P0_7_CLAUDE_REVIEW.md`; correcciones `.ai-local/P0_7_AGY_CORRECTIONS_CYCLE2.md`). Checks PASS: 174/174 hashes producto, backup SQL = HEAD, solo 6 `.md`, UTF-8 sin BOM/LF/mojibake 0, `CRED_PAIR=0`, `CLI_PASSWORD=0`, reuso credenciales HEAD 0, auxiliares 0 hits. Reviewer: Claude. Sin build/Jest (docs-only).
  | # | Sev. | Hallazgo (sin valores) | Archivo | Cambio requerido | Test/check | Resultado |
  |---|---|---|---|---|---|---|
  | R1 | BLOCKER | Reemplazo global sin límites de palabra inyectó `<contraseña-segura>` en ~27 datos de ejemplo (RUC, timbrado, teléfono, CSV RG90, client-id) y una línea de texto | SISTEMA_IVA_GUIA, API_ENDPOINTS, GOOGLE_OAUTH_SETUP | Restaurar tokens desde HEAD en memoria | `\w<contraseña-segura>` = 0 | cerrado ciclo 2 (corrupción 0; líneas HEAD restauradas salvo las retiradas por S4/S6/S11) |
  | R2 | BLOCKER | Marcas C2, C3, C6, C8, C10, C13 no insertadas en CLAUDE.md (script buscó paráfrasis) | CLAUDE | Insertar sobre texto real | conteo de marcas | parcial ciclo 2 (presentes; C13 dentro de fence → T5) |
  | R3 | BLOCKER | Instalación `mysql … < schema_bd_sis_iva.sql` sigue vigente | README, SISTEMA_IVA_GUIA, basededatos | Retirar con 1 línea + punteros | `mysql -u root <` = 0 | cerrado ciclo 2 (checkpoint FAIL = falso positivo por fila C4 de la tabla → T2) |
  | R4 | IMPORTANTE | Contraseña literal en `nueva_password` (=literal de HEAD) | API_ENDPOINTS:230 | Placeholder | JSON literal = 0 (regex ampliada) | cerrado ciclo 2 (literal 0/placeholder 15) |
  | R5 | IMPORTANTE | Cuenta SMTP real en §8 Email | CLAUDE:358 | Quitar dirección | EMAIL no genérico = 0 | cerrado ciclo 2 |
  | R6–R7 | IMPORTANTE | `` `n `` partió "npm" (3 sitios); marca dentro de tabla §2 rompe render | CLAUDE, API_ENDPOINTS | Unir líneas; mover marca | `^pm run` = 0 | cerrado ciclo 2 |
  | R8 | IMPORTANTE | Fila C2 afirma "OAuth NO auto-crea" sin "código aún auto-crea → P1a.8a" (P1 presentado como hecho); faltan marcas inline OAuth | 5 docs | Agregar P1a.8a + marcas | línea con P1a.8a | parcial ciclo 2 (CLAUDE:370 sin P1a.8a = checkpoint FAIL; falta GOOGLE "Consideraciones") → T1/T5 |
  | R9 | IMPORTANTE | Plantilla email/password de admin fijo en vez de nota bootstrap | CLAUDE:335,484; README:65 | Nota bootstrap | revisión | cerrado ciclo 2 en CLAUDE/README; regresión en API → R12 |
  | R10–R11 | MENOR | Tablas genéricas/no aplicables; C12 (email bienvenida) sin aplicar; resultado AGY inexacto | 5 docs, P0_7_AGY_RESULT | Ajustar | revisión | C12 cerrado; R10 no hecho (tabla idéntica en 5 docs); R11 inexacto (declara Hecho; literales en informe contenidos por Codex; sufijo indebido en fila GUÍA FINAL) → T2/T7 |
  Review Claude ciclo 2 — 2026-10-08 11:38:13 -03:00: **RECHAZADO** (`.ai-local/P0_7_CLAUDE_REVIEW.md` §ciclo 2; correcciones `.ai-local/P0_7_AGY_CORRECTIONS_CYCLE3.md` T1-T7). Checkpoint `p07_codex_checkpoint.cjs` pass:false (3/26 FAIL: oauth-decision CLAUDE, obsolete-install README/SISTEMA). PASS: escáner CRED_PAIR=0/CLI_PASSWORD=0, JSON literal 0, reuso HEAD 0 en docs, corrupción 0, 174/174 hashes, SQL histórico = HEAD, encoding, alcance 6 `.md`. Auxiliares: 0 hits salvo `.ai-local/p06d_integration.ts:329-330` (fixture P0.6d preexistente, git-ignored, coincide con 1 ejemplo JSON de HEAD; no copia AGY); informe AGY 0 hits tras contención Codex. Reviewer: Claude. Sin build/Jest (docs-only).
  | R12 | IMPORTANTE | Sección "Credenciales de prueba" = plantilla email/password; marca bootstrap de ciclo 1 borrada (S6) | API_ENDPOINTS:1159-1165 | Nota bootstrap | `bootstrap:admin` ≥1 | abierto (T3) |
  | R13 | IMPORTANTE | C5 sin marcar en CLAUDE ("22 tablas… MySQL 8.0… listo para servidor", 41 `menu_rol`, "100% sincronizados"); omisión reviewer ciclo 1 | CLAUDE §6/§8/§10 | Marca C5 (21 tablas, 37, D23 MariaDB 11.8) | `MariaDB` ≥1 | abierto (T4) |
  | R14 | MENOR | Marcas dentro de bloques de código / cortando lista | CLAUDE:453; SISTEMA:295,297; GOOGLE:62,72 | Mover tras el bloque | 0 marcas en fence | abierto (T5) |
  | R15 | MENOR | "Pendiente: completar credenciales Google" contradice D2/P1a.8d; README:57 lead-in huérfano | CLAUDE §8; README:57 | Marca / eliminar | revisión | ciclo 3: sufijo CLAUDE:383 y lead-in README corregidos/verificados; puntero C2 §8 con P1a.8a ausente → U1 |
  Review Claude ciclo 3 — 2026-10-08 11:55 -03:00: **RECHAZADO** por regresión (`.ai-local/P0_7_CLAUDE_REVIEW.md` §ciclo 3; correcciones `.ai-local/P0_7_AGY_CORRECTIONS_CYCLE4.md` U1-U2). Snapshot estable (hashes 6 docs iguales antes/después). Checkpoint 32/32 PASS y escáner CRED_PAIR=0/CLI_PASSWORD=0 (seguridad: literal 0, reuso 0, corrupción 0, fences 0, 174/174, SQL=HEAD, encoding) — pero los checks son negativos. Docs reescritos en bloque 11:48-11:49 casi = HEAD (`basededatos.md` idéntico a HEAD; 0 tablas de corrección, `bootstrap:admin` 0, `Retirado en P0.7` 0, C1/C2-C3 §7/C4/C6-C11 perdidos). Estado: R12 abierto (T3 no hecho), R13 corregido/verificado (T4), R14 corregido/verificado en lo presente (T5), R10 regresión (T2 no hecho), R1/R4-R6 siguen PASS, R2/R3/R7-R9 regresión → U1. R11 reincidente: informe AGY declara T2/T3 "Hecho" y pide purga de historial (no aprobada; riesgo histórico D13/P1a.4, no requisito P0.7 → U2). Reviewer: Claude. Sin build/Jest (docs-only).
  Review Claude ciclo 4 — 2026-10-08 12:03 -03:00: **RECHAZADO** (`.ai-local/P0_7_CLAUDE_REVIEW.md` §ciclo 4 V1-V8; correcciones `.ai-local/P0_7_AGY_CORRECTIONS_CYCLE5.md` W1-W7). Snapshot estable (6 docs iguales 11:59:30/12:00:15). Checker actual ejecutado: **58/58 PASS** exit 0 (informe AGY dice 32 → conteo viejo). Seguridad PASS. Semántica: V1 BLOCKER artefacto escape `nnpm` + línea partida (8 ocurrencias CLAUDE/README/SISTEMA/API); V2 BLOCKER marcas de relleno "Extra" (CLAUDE:544-545, basededatos:1259) — sin ellas CLAUDE 10<12, basededatos 1<2; V3 BLOCKER basededatos tabla cita C4/C5 sin notas en cuerpo; V4 C11 admin CLAUDE:362 con dos placeholders; V5 C7/C9/C10/C12/C14/C16 0 marcas (SISTEMA:144 agrupa C7 con bootstrap); V6-V8 menores. PASS: C1 6/6, C2/C3 §7 + SISTEMA/GOOGLE, T1, C4 contenido, C5 D23/21/37, C13, T3 API, Retirado README/SISTEMA, tablas 5 distintas, fences 0. Reviewer: Claude. Sin build/Jest (docs-only).
  Review Claude ciclo 5 (último autónomo) — 2026-10-08T12:32:02-03:00: **RECHAZADO → HUMAN_DECISION_REQUIRED** (`.ai-local/P0_7_CLAUDE_REVIEW.md` §ciclo 5 X1-X9). No se emite ciclo 6. Snapshot estable (6 docs iguales 12:29:46/12:31:49). Checker real **79/79 PASS** exit 0 (AGY dice 80 → menor). Escáner CRED_PAIR=0/CLI_PASSWORD=0; JSON literal 0, reuso HEAD 0, 174/174, SQL=HEAD; auxiliares (`fix_r1.ps1`, informe AGY, JSON Codex) 0 reusos. W1-W4 PASS. Reviewer: Claude. Sin build/Jest (docs-only).
  | # | Sev. | Hallazgo (sin valores) | Archivo | Check | Resultado |
  |---|---|---|---|---|---|
  | X1 | BLOCKER | Mojibake por doble codificación UTF-8 introducido (HEAD 0 líneas → disco CLAUDE 149, SISTEMA 212, API 143, README 10); checker `encoding` no lo detecta | CLAUDE, SISTEMA, API, README | bytes `C3 83`/`C3 A2 E2 82 AC` por línea vs HEAD | abierto |
  | X2 | IMPORTANTE | C7/C9/C10/C14/C16 marcas-etiqueta sin contenido ni puntero P1/P2/D; C9 invierte el sentido | CLAUDE:329,354,359,417,496 | revisión semántica | abierto |
  | X3 | IMPORTANTE | C12 afirma provider de email ausente; código usa SMTP (`MailerService`) | CLAUDE:305 | contraste con código | abierto |
  | X4 | IMPORTANTE | Agrupación C6/C7/C8/C11 y C6/C8/C10 con bootstrap; C6/C8 sin marca propia | SISTEMA:140; CLAUDE:506 | revisión semántica | abierto |
  | X5–X9 | MENOR | Tabla CLAUDE vacía; marcas sin ID; banners README/SISTEMA/API sin "prevalece"; C7 parte ítem de lista; informe AGY inexacto | varios | revisión | documentados, no bloqueantes |
- [ ] **GUÍA FINAL DE OPERACIÓN / QA** (Requisito futuro post P0.6/P0.7): Crear guía detallada de prueba desde cero (preparar BD limpia, variables, migrations, seeds, bootstrap Admin Plataforma, dataset QA, credenciales efímeras ingresadas en sesión (nunca documentadas), iniciar API/BFF, probar roles, empresas QA, aislamiento, contribuyentes, compras/ventas, estados D6, exportación RG90, checklist).
  - [ ] G1 Documental: redactar .ai-work/OPERATIONS_QA_GUIDE.md y .ai-work/TENANCY_COMMERCIAL_MODEL.md (AGY) → review Claude → checkpoint Codex. Única subtarea que puede marcarse [x] sin ejecución.
  - [ ] G2 Ejecución de instalación local limpia (requiere migración inicial MariaDB versionada; hoy BLOQUEADA).
  - [ ] G3 Recorrido QA E2E (requiere MIGRACIÓN MULTIEMPRESA, P1a.7, P1c/P1d; recorrido comercial pagado se hará tras definir Q1/D11. La gestión inicial LIBRE se valida sin cobros).
  - [ ] G4 Ejecución de migración/unión de empresas (requiere D24 + plan aprobado; BLOQUEADA).

## P1a — Seguridad

- [x] **P1a.1** API: restringir `/roles`, `/menu`, `/grupo-menu` y `/menu-rol` explícitamente al rol Administrador (API P1.1).
  Depende de: P0.5a. Decisión: D3.
  Aceptación: pruebas negativas — Contador y Solo Lectura reciben 403 en lectura y escritura; no hay autoasignación de privilegios.
  Estado 2026-10-09: Implementado AGY ciclo 3 (C1-C7). Tests PASS (unit 5/5, e2e 10/10, auth/usuarios 14/14). Lint real: 0 errors, 0 warnings. Artefacto eslint_out.json eliminado. Producto inmutable aprobado. Claude review3 2026-10-09: APROBABLE (C1-C7 verificados; unit 5/5, e2e 10/10, regresión 14/14, eslint 0E/0W sin disables; snapshot producto igual a review2). Siguiente: checkpoint Codex independiente. (Principal P1a.1 sigue [ ]).
- [ ] **P1a.2** API: serialización sin `password` (DTO de salida o `@Exclude`) en usuarios y en relaciones cargadas, como las asignaciones.
  Aceptación: ningún endpoint devuelve hashes.
- [ ] **P1a.3** BFF: proyección explícita de props de usuarios y asignaciones hacia Inertia (F02).
  Depende de: P1a.2.
  Aceptación: las props no contienen hashes ni campos sensibles.
- [ ] **P1a.4** Respuesta operativa a la exposición histórica: revocar refresh tokens, forzar cambio de las contraseñas enviadas por email, purgar logs y rotar las credenciales documentadas, sin copiar valores.
  Depende de: P0.2, P0.7. Decisión: D13.
- [ ] **P1a.5** Sesión y tokens. Fusiona la tarea P1 "refresh/remember/logout/revalidación" con la P2 "rotación atómica/revocación tras cambio o reset/inactivos" (F03).
  Aceptación global: un JWT vencido no aparenta listas vacías y el logout revoca según la política.
  - [x] **P1a.5a** BFF: manejo centralizado de 401 en ApiHelper y cierre de la sesión local. COMPLETADA 2026-10-09: AGY2 + Claude review2 APROBABLE + Codex checkpoint APROBADO; 30tests/172aserciones y snapshot40estable. R8 menor diferido P1b.3.
    Estado 2026-10-09: análisis Claude completado (.ai-local/P1A_5A_CLAUDE_ANALYSIS.md, F1-F10; F7 diferido P1a.5c). Instrucciones AGY listas (.ai-local/P1A_5A_AGY_INSTRUCTIONS.md). Sin cambios de producto. Siguiente: Codex snapshot git BFF + invocar AGY.
  - [ ] **P1a.5b** BFF: refresh de tokens.
    Depende de: P1a.5a.
  - [ ] **P1a.5c** BFF: política de remember coherente con el JWT.
  - [ ] **P1a.5d** BFF + API: logout que revoque el refresh token en la API.
  - [ ] **P1a.5e** API: rotación y consumo atómicos de refresh/reset tokens.
  - [ ] **P1a.5f** API: revocación de sesiones tras cambio o reset de contraseña, y revalidación de rol y estado activo.
- [ ] **P1a.6** Aislamiento por contribuyente según rol y asignaciones, un módulo a la vez (API P1.2).
  Depende de: P0.5a, MIGRACIÓN MULTIEMPRESA. Decisión: D1.
  Aceptación: pruebas negativas de acceso cruzado en cada módulo.
  - [ ] **P1a.6a** Compras.
  - [ ] **P1a.6b** Ventas.
  - [ ] **P1a.6c** Bolsa de revisión.
  - [ ] **P1a.6d** Exportaciones RG90.
  - [ ] **P1a.6e** Asignaciones y contribuyentes (listados filtrados según el usuario).
- [ ] **P1a.7** BFF: habilitar el login de Contador y Solo Lectura (hoy filtra por el literal "Administrador"), con navegación y acciones según los permisos de menú; Solo Lectura sin acciones de escritura.
  Depende de: P1a.1, P1a.5, P1a.6. Decisión: D1.
  Aceptación: cada rol accede solo a lo permitido; la API sigue siendo la barrera de seguridad.
- [ ] **P1a.8** OAuth integrado. Fusiona "Google opcional" con la tarea P2 "OAuth seguro".
  Depende de: P0.1, P1a.1, P1a.5. Decisión: D2.
  - [ ] **P1a.8a** API: autenticar solo usuarios existentes y activos por email; sin autoalta; conservar el rol; rechazar si no existe.
  - [ ] **P1a.8b** API: callback sin access/refresh tokens en la URL.
  - [ ] **P1a.8c** Frontend: callback e inicio de sesión con Google.
  - [ ] **P1a.8d** Configurar credenciales en los entornos (recién después de P1a.8a–c) y actualizar `GOOGLE_OAUTH_SETUP.md`.
- [ ] **P1a.9** (deuda registrada en P0.6d) API: el hook `@BeforeInsert` de `Usuario` omite el hash si la contraseña empieza con `$2b$`; en el alta normal una contraseña plaintext con ese prefijo se guarda sin hashear. Hashear siempre en el servicio de alta (o detectar hash bcrypt válido de forma robusta) y cubrir con tests. No implementado en P0.6d.

## P1b — Contratos y navegación

- [x] **P1b.1** Frontend: corregir 12 referencias Vue y seis redirects de catálogos a `parametros.*` (F04).
  COMPLETADA 2026-10-31: AGY implementación, Claude APROBABLE y checkpoint Codex APROBADO. Diff exacto 18 reemplazos en 14 archivos, test nuevo 13/13 PASS (63 aserciones) con HTTP fake/SQLite memoria. Sin BD persistente ni Git write. Evidencia `.ai-local/P1B_1_CLAUDE_REVIEW.md`. Ziggy estático no consumido queda residual; `password.request` de Login requiere evaluación en P1b.3/P2.11.
  Aceptación: alta, edición y baja resuelven las rutas sin error después de persistir.
- [x] **P1b.2** API: DTOs de consulta con filtros para compras, ventas, suscripciones, cuotas y asignaciones (API P1.4).
  COMPLETADA 2026-10-31: AGY implementación + Claude APROBABLE + Codex checkpoint APROBADO. Cinco DTOs, helper/estados, cinco controllers y test; services/schema/BFF intactos (baseline 25/25). Jest focalizado 107/107 PASS confirmado por Claude y Codex; ESLint 8 archivos nuevos limpio. tsc global falla solo por TS18046 histórico bootstrap-admin.spec.ts:204; lint controllers conserva errores históricos y tres warnings de disable ya innecesario. Residuales IDs enormes/paginación permisiva, order y query BFF registrados en `.ai-local/P1B_2_CLAUDE_REVIEW.md`, no bloqueantes.
  Aceptación: `contribuyente_id`, `estado_ocr` y los demás filtros no devuelven 400.
- [x] **P1b.3** BFF: manejo de errores centralizado en ApiHelper. Fusiona F06 "errores visibles", F11/F12 "errores Nest string/array" y "payloads validados". Confirmar el contrato real de auth y catálogos antes de modificarlo.
  COMPLETADA 2026-10-31: AGY ciclos1-2 + Claude review2 APROBABLE + checkpoint Codex APROBADO. Errores normalizados/visibles en compras y ventas; filtros codificados y arrays inválidos con aviso sin500; reclamar vuelve a PROCESANDO; payloads de tres catálogos validados y Ciudad consulta país conJWT; logs y login/permisos corregidos; 401JWT conserva terminador local. Codex final47tests/813aserciones +44regresiones/236aserciones PASS (91/1049), php-l4PASS, 2SFC compilados, snapshot116sin drift; baseline17cambiados/97intactos. Evidencia `.ai-local/P1B_3_CLAUDE_REVIEW_CYCLE2.md` y `.ai-local/P1B_3_CODEX_FINAL_CHECKPOINT.md`. Residuales otros listados/timeout/flash global aP1b.4/P2.7/P2.4; O6Bearer compartido menor. Usuario pidió terminar aquí; P1b.4 NO iniciada.
  Depende de: P1a.5a.
  Aceptación: filtros y retorno tras reclamar distinguen vacío, 400, 401/403 e indisponibilidad; los mensajes Nest en string o array se muestran correctamente.
- [ ] **P1b.4** Frontend: paginación remota y selectores con búsqueda que conservan filtros (F07).
  Depende de: P1b.2.
  Aceptación: se accede a registros posteriores a 60/100 y se muestra el total real.
- [ ] **P1b.5** Persona-documentos: implementar el CRUD real en API + página, o retirar la ruta BFF y el menú id=14 (F05).
  Decisión: D4.
  Aceptación: sin página inexistente ni respuesta plantilla.
- [ ] **P1b.6** API + BFF: alta persona/contribuyente atómica o recuperable, validando todo antes de crear (F08).
  Aceptación: un fallo o reintento no duplica personas ni deja persistencia parcial.

## P1c — Integridad fiscal

- [ ] **P1c.1** API + frontend: normalizar documentos, RUC y DV, también en edición (API P1, F09).
- [ ] **P1c.2** Máquina de estados única de comprobantes (compras y ventas), según D6. Fusiona "estados" de reglas unificadas, "responsable/transiciones" de la bolsa y "aptitud" de RG90; la consumen P1d.7 y P1d.11.
  - Estados operativos: los cinco de D6. `EN_COLA` reservado; `ENTRENADO` y `LISTO_PARA_ENTRENAR` se retiran del estado del comprobante y pasan al ciclo de entrenamiento (`ocr_entrenamientos`); no agregar `EXPORTADO`.
  - La API aplica solo las transiciones de D6 mediante acciones explícitas (reclamar, confirmar/corregir); `estado_ocr` deja de ser editable por PATCH libre.
  - Editar datos fiscales relevantes de `AUTO_PROCESADO` o `VERIFICADO_HUMANO` revalida; confirmado por un usuario autorizado, queda `VERIFICADO_HUMANO`.
  - Solo la confirmación humana genera ground truth de entrenamiento, preservando los datos listados en D6.
  - Antes de implementar: definir los "aspectos que D6 no cubre" que la tarea necesite, y revisar los datos existentes con estados retirados.
  Depende de: P0.6b (si cambia el schema), P1c.3. Decisión: D6.
  Aceptación: transiciones inválidas y PATCH directo de `estado_ocr` rechazados por la API; la UI no expone estados editables libremente.
- [ ] **P1c.3** API: validador único usado por alta manual, OCR y update (cuadratura, recálculo IVA, identidad fiscal); la UI refleja reglas y errores (API P1.5, F09).
  Depende de: P1c.1.
  Aceptación: inconsistencias rechazadas en los tres caminos.
- [ ] **P1c.4** Script de detección de duplicados fiscales existentes (solo lectura).
  Decisión: D5.
- [ ] **P1c.5** Depuración de duplicados existentes según la política acordada.
  Depende de: P1c.4. Decisión: D5.
- [ ] **P1c.6** Migración de índices únicos fiscales.
  Depende de: P0.6b, P1c.5, MIGRACIÓN MULTIEMPRESA. Decisión: D5.
  Aceptación: duplicados concurrentes rechazados por la BD.
- [ ] **P1c.7** Frontend: comprobantes asociados en EditForm/update de compras (hoy solo en el alta).
- [ ] **P1c.8** Asociados (comprobante/timbrado) en ventas: migración + API + UI.
  Depende de: P0.6b.
- [ ] **P1c.9** Gestión de timbrados (administración y vigencia), separada de la validación de comprobantes.
  Depende de: P0.6b. Decisión: D7.

## P1d — Flujo OCR → revisión → RG90

- [ ] **P1d.1** API: validador OCR — dato faltante → `REQUIERE_REVISION`, sin fecha por defecto igual a hoy, confianza real de Vision, padrón ausente fuerza revisión (API P1.6).
  Depende de: P1c.3.
  Aceptación: el caso sin número ni timbrado no se autoaprueba.
- [ ] **P1d.2** Carga y actualización del padrón `set_rucs` (hoy vacío).
  Decisión: D9.
- [ ] **P1d.3** API: validar antes de escribir en R2; compensación de imagen, comprobante y cápsula ante fallos.
- [ ] **P1d.4** Modelo de acceso a imágenes en R2 (subido desde P2 por R4).
  Decisión: D10.
- [ ] **P1d.5** BFF: helper multipart con JWT (no reutilizar `postWithFile` con API key) (F10).
  Depende de: P1a.5a.
- [ ] **P1d.6** Frontend: pantalla de carga OCR de compra y venta con resultados reales; corregir el mapeo de menú `/ocr/cargar` (F10).
  Depende de: P1d.1, P1d.5, P1a.6.
- [ ] **P1d.7** API + frontend: bolsa sobre la máquina de estados de P1c.2 (API P1.8, F06/F09).
  - Lista `REQUIERE_REVISION` sin revisor.
  - Reclamar es atómico, pasa a `PROCESANDO` y asigna el revisor responsable.
  - Confirmar/corregir, por usuario autorizado y con validaciones aprobadas, pasa a `VERIFICADO_HUMANO` y genera el ground truth de entrenamiento.
  - Visor de imagen y correcciones; la UI no ofrece selector libre de `estado_ocr`.
  Depende de: P1c.2, P1a.6c, P1d.4. Decisión: D6, D10.
  Aceptación: dos revisores no reclaman el mismo comprobante; solo el revisor responsable o un usuario autorizado confirma; no se verifican documentos incompletos.
- [ ] **P1d.8** Obtener la especificación oficial RG90 vigente y un archivo de ejemplo aceptado.
  Decisión: D8.
- [ ] **P1d.9** API: corregir el builder RG90 — 5 %, exentas, escape de `;` y saltos de línea, DV, tipo de identificación, cantidad de campos (API P1.7).
  Depende de: P1d.8. Decisión: D8.
  Aceptación: importes conservados (caso 11000/21000/5000) y formato validado contra el ejemplo aceptado.
- [ ] **P1d.10** Frontend: descarga RG90 por contribuyente y período; corregir el mapeo de menú de exportaciones (F10).
  Depende de: P1d.9, P1a.6d.
- [ ] **P1d.11** API: RG90 exporta únicamente `AUTO_PROCESADO` y `VERIFICADO_HUMANO`; nunca `REQUIERE_REVISION`, `PROCESANDO` ni `ERROR_PROCESAMIENTO`. La exportación no cambia `estado_ocr` y puede repetirse. El formato exacto sigue en P1d.8/P1d.9 (D8 pendiente).
  Depende de: P1c.2. Decisión: D6.
  Aceptación: comprobantes en estados no exportables quedan fuera del CSV.

## P1e — Suscripción (sin modelo comercial)

- [ ] **P1e.1** API: corregir SuscripcionGuard — ausencia de suscripción, morosidad, trial cancelado con fecha NULL, cancelada histórica que interfiere con una activa nueva (API P1.9). La política detallada de vigencia se completa en la Fase SaaS.
  Depende de: MIGRACIÓN MULTIEMPRESA.
  Aceptación: casos reproducidos en tests.

## P2 — Antes de producción

- [ ] **P2.1** Auditoría persistente de operaciones contables, permisos y cobranza (actor, fecha, cambios), diseñada junto con P1c.2.
  Depende de: P0.6b.
- [ ] **P2.2** R2: claves únicas y limpieza de huérfanos (el acceso protegido se adelantó a P1d.4).
- [ ] **P2.3** SMTP fiable y trazable, con reintentos.
- [ ] **P2.4** Configuración validada por servicio (obligatoria u opcional), timeouts de ApiHelper y traducción de errores FK/duplicados.
- [ ] **P2.5** Observabilidad.
- [ ] **P2.6** BFF: invalidar el menú cacheado al cambiar permisos (F11).
- [ ] **P2.7** UI: feedback por campo y flash global (parte UI de la tarea de errores fusionada; F11).
  Depende de: P1b.3.
- [ ] **P2.8** Comprobar la compatibilidad Inertia y la navegación sin asumir fallo solo por versiones; recorrido visual, responsive y accesibilidad en navegador (F12).
- [ ] **P2.9** Documentación coherente (README, CLAUDE, API_ENDPOINTS, copias detalleapi, versión de Node), lint y CI; retirar promesas de la UI no entregadas (F10/F12).
- [ ] **P2.10** Medir el OCR síncrono y decidir si hace falta Redis/BullMQ (background, idempotencia, reintentos, recuperación, estados reales en la UI).
  Decisión: D12.
- [ ] **P2.11** Recuperación de contraseña en el frontend, según alcance.
  Depende de: P1a.5e.

## Fase SaaS — Modelo comercial

Toda la fase requiere D11 y P0.6b. Aceptación global: reglas de deuda, pago y consumo comprobables, con la UI alineada.
Servicio gestionado inicial sin cargo en LIBRE total; operación directa futura pagada, con cuota/medición pendientes (Q1/D11). FREE con límites queda como opción futura; no inventar cupos, precios, períodos, trial, morosidad ni renovación.

- [ ] **S.1** Planes: catálogo, precios y vínculo con la suscripción.
- [ ] **S.2** Vigencia completa de la suscripción.
  Depende de: S.1, P1e.1.
- [ ] **S.3** Límites de consumo concurrentes (manual y OCR).
  Depende de: S.2.
- [ ] **S.4** Cuotas, pagos y estado de cuenta (balance).
  Depende de: S.2.
- [ ] **S.5** Generación y renovación de cuotas idempotentes.
  Depende de: S.4.

## P3 — Optimización y alcance opcional

- [ ] **P3.1** Reutilizar workers Tesseract y limitar la concurrencia.
- [ ] **P3.2** Pipeline OCR compartido compra/venta; optimizar consultas, eager, índices y exportaciones grandes.
- [ ] **P3.3** Retirar código heredado (TaxValidationService, sendCotizacionEmail, findOrCreateByEmail con password fijo), comentarios y `any`; corregir la relación inversa de ventas; revisar controllers públicos no conectados.
- [ ] **P3.4** Dashboard con métricas reales, sin presuponer endpoints existentes.
  Decisión: D15.
- [ ] **P3.5** Swagger/OpenAPI (opcional; ya existen API_ENDPOINTS y Postman).
- [ ] **P3.6** Entrenamiento OCR real, solo si se decide; guardar correcciones no lo implementa.
- [ ] **P3.7** Detalle por ítems o emisión electrónica.
  Decisión: D14.

## Reanudación

- No repetir la auditoría completa de la API. Partir de SYSTEM_STATE y elegir una tarea autorizada; confirmar solo los contratos y el código afectados.
- Los resultados persistidos de la API son históricos y no certifican el despliegue actual.
- Preservar los cambios locales ajenos en ambos repositorios.
- Evidencia de prioridades, fusiones y divisiones: `CLAUDE_ROADMAP_REVIEW.md`.




### Pausa de orquestación — 2026-10-08 10:38:16 -03:00 (HISTÓRICO)
P0.6d principal completada. Claude ciclo3 APROBABLE (39/39 Jest, build0, snapshot getter PASS), integración ciclo2 90 PASS/0 FAIL con cleanup. O1 implementada y verificada Claude. Codex restauró23 símbolos deteriorados de TASKS.

### Transición a P0.7 — 2026-10-08 10:48:00 -03:00
P0.6d principal cerrada documentalmente [x]. Codex checkpoint final APROBADO (2026-10-08 10:44). Siguiente paso: P0.7 (Docs versionados). Usuario autoriza avanzar tras P0/guía. Timebox extendido a 12:10.



Nota de control P0.7 (2026-10-08T11:28:49.9259883-03:00): comprobacion Codex intermedia, AGY ciclo2 aun activo: JSON literal0, reuso HEAD0, corrupcion ejemplos0,174/174 producto y SQL intacto PASS; R7/R8 aun pendientes en CLAUDE (tabla/precision OAuth). No es checkpoint final ni cierre. Test: .ai-local/p07_codex_checkpoint.cjs; reviewer Codex.

P0.7 control 2026-10-08T11:34:42.8304180-03:00: IMPORTANTE detectado Codex: resultado AGY ciclo2 copio literales historicos password en R4. Contencion documental: linea sustituida por descripcion sin valores en P0_7_AGY_RESULT.md. Pendiente verificacion Claude de auxiliares; no cierre.

P0.7 review Claude ciclo 2 — 2026-10-08 11:38:13 -03:00: RECHAZADO. Auxiliares verificados sin valores (informe AGY 0 hits; único hit fixture P0.6d preexistente git-ignored). Siguiente: AGY ciclo 3 (`P0_7_AGY_CORRECTIONS_CYCLE3.md`). Pendiente Codex: revertir sufijo "(corregido ciclo 2…)" puesto por AGY en la fila GUÍA FINAL. Principal P0.7 sigue [ ].


Control P0.7 2026-10-08T11:50:55.6676860-03:00: AGY entrego ciclo3 T1-T7 en P0_7_AGY_RESULT.md; declara32 checks PASS/fences0/hash174 intactos. Estado implementado, pendiente review Claude3. Principal sigue [ ]. Reviewer debe verificar snapshot estable; CLI AGY rootidle con1 tarea fondo (sin cerrar terminal).

Control P0.7 2026-10-08T11:59:33.6204840-03:00: AGY ciclo4 U1/U2 entregado exit0; declara recuperacion de marcas/banners/bootstrap/tablas. Implementado pendiente Claude4; principal [ ]. No tomar conteo32 del informe como evidencia: reviewer ejecuta checker actual reforzado.

P0.7 review Claude ciclo 4 — 2026-10-08 12:03 -03:00: RECHAZADO. Checker real 58/58 PASS (no 32); semántica falla V1 `nnpm`/líneas partidas, V2 marcas "Extra" de relleno, V3 basededatos sin C4/C5, V4 C11, V5 C7/C9/C10/C12/C14/C16 ausentes. Siguiente: AGY ciclo 5 (`P0_7_AGY_CORRECTIONS_CYCLE5.md`). Principal [ ] hasta Codex.

Control P0.7 2026-10-08T12:02:17.2982188-03:00: AGY ciclo5 final autorizado W1-W7 en curso. Aclaracion Codex W3: migration:run solo tooling, carpeta vacia; no presentarlo como instalacion; usar punteros baseline local historico/seed/bootstrap. Claude4 emitio hallazgos12:01 aprox aunque algunos reportes dicen12:03; esta nota conserva hora real. Principal pendiente; si trasreview5 quedaIMPORTANTE/BLOCKER aplicar limite5.

P0.7 control 2026-10-08T12:07:37.3866375-03:00: Codex comprobacion intermedia mientras AGY5 activo, .ai-local/p07_codex_checkpoint.cjs:79 checks,75 PASS,4 FAIL (marcas minimas CLAUDE/README/SISTEMA, tablas distintas). Reporte .ai-local/P0_7_CODEX_CYCLE5_INTERIM.json. No dictamen final; pendiente entregaAGY5/Claude5.

## Pausa de orquestacion 2026-10-08T12:13:33.4002926-03:00 — PAUSED_BY_TIMEBOX
P0.6d[x] cerrado; P0 11/12. P0.7 principal[ ]: AGY ciclo5 W1-W7 entregado exit0; implementado pendiente Claude review5 y checkpointCodex. Revisiones1-4 RECHAZADO conservadas en P0_7_CLAUDE_REVIEW.md; no perder hallazgos V1-V8.
Codex comprobacion mecanica de cierre .ai-local/P0_7_CODEX_TIMEBOX_CHECK.json:79/79 PASS exit0,174/174 producto intactos, SQL=HEAD, encoding/fences/secretos PASS. Scanner CRED_PAIR0/CLI_PASSWORD0. AGY reporte dice80: discrepanciaMENOR detectada Codex, pendiente Claude. Esto NO es checkpoint aprobatorio ni cierre P0.7.
RESUME_FROM: invocar Claude real con .ai-local/P0_7_CLAUDE_REVIEW_CYCLE5_REQUEST.md. Si queda IMPORTANTE/BLOCKER trasreview5, HUMAN_DECISION_REQUIRED y no ciclo6. Si APROBABLE, Codex checkpoint y cierreAGY, releer TASKS. Guia y P1 no iniciadas. QA/prod sin accesos/escrituras; index vacio; no staging/commit/push; no terminales cerradas.

## P0.7 review Claude ciclo 5 — 2026-10-08T12:32:02-03:00 — HUMAN_DECISION_REQUIRED
Reanudación autorizada por usuario (sin límite 12:10). Dictamen **RECHAZADO**: X1 BLOCKER mojibake doble UTF-8 introducido en CLAUDE/SISTEMA/API/README (~514 líneas; HEAD 0); X2-X4 IMPORTANTE (marcas C7/C9/C10/C14/C16 sin contenido, C12 falsa, agrupaciones con bootstrap). Checker real 79/79 PASS (no detecta X1), seguridad PASS, snapshot estable. Límite de 5 ciclos alcanzado: no ciclo 6. P0 11/12; P0.7 principal [ ]; sin checkpoint Codex aprobatorio. Decisión del usuario requerida (ciclo 6 excepcional acotado X1-X4 / otro implementador / aceptar con riesgo). Guía de operación y P1 no iniciadas. Sin Git escritura/BD/QA/prod; `fix_r1.ps1` no ejecutado ni descartado.

Control Codex 2026-10-08T12:43:23.3872450-03:00: reviewClaude5 RECHAZADO; HUMAN_DECISION_REQUIRED (límite5). Confirmación independiente:519líneasmojibake con regexmásamplia (HEAD0); proveedorSMTP/sendMailreal, notaC12falsa. 79checksPASSno certificansemántica/encoding; principalP0.7sigue[ ]. Paquete concreto .ai-local/P0_7_HUMAN_DECISION_PACKET.md; noimplementaciónnueva. Pedido independiente usuario completado:3skillsglobales descargadas/pinned, notasalcance/arranque .ai-local/LOCAL_TESTING_NOTES.md (comandosnoejecutados); no código/diseño/P1/deploy.

## Reanudación autónoma 2026-10-09 — Codex
TASK: P0.6d
FINDING: Pedido actual afirma pendiente; TASKS y código contienen correcciones y cierre previo. Revalidación focalizada solicitada a Claude, sin repetir auditoría.
SEVERITY: CONTROL_DE_ESTADO
FILE: src/database/seeds/bootstrap-admin*; .ai-work/TASKS.md
FIX: Contrastar lista actual con implementación/tests antes de reabrir o confirmar aprobación.
IMPLEMENTED_BY: AGY (histórico)
TEST: Pendiente dictamen actual; 39 tests y 90 comprobaciones BD son históricos.
REVIEWED_BY: Claude en curso; Codex pendiente.
STATUS: REVALIDATING
NEXT_ACTION: Recoger .ai-local/P0_6D_REVALIDATION_20261009.md; si APROBABLE checkpoint Codex; si cambios, AGY según instrucciones Claude.
P0.7: HUMAN_DECISION_REQUIRED / FIVE_CYCLES_EXHAUSTED; no sexto ciclo. Seguir rama independiente elegible después de resolver P0.6d. Ruta mínima P1b.3: P1a.5a; P1b.4: P1b.2. P1b.5 bloqueada D4; P1c.4-6 D5; P1c.2 además necesita aspectos D6 no definidos.
Autorización actual permite continuidad entre tareas, prevalece sobre reglas locales anteriores de detener al cerrar. Sin Git escritura, QA/prod ni BD persistente. Rama a1; dirty preexistente inventariado con git status --short --untracked-files=all. README_P0.6d_REVISION_CLAUDE.md no encontrado.
### P0.6d control Codex 2026-10-09
TASK: P0.6d
FINDING: Checkpoint sanitizador y tests focalizados actuales PASS; primera llamada Claude falló ECONNREFUSED exit1, reintento fuera sandbox por regla de escalación.
SEVERITY: VALIDATION / ENVIRONMENT
FILE: src/database/seeds/bootstrap-admin.spec.ts; bootstrap-admin.config.spec.ts
FIX: Reintentar revisión real Claude; no sustituirla por aprobación Codex.
IMPLEMENTED_BY: AGY (histórico); sin cambios de producto hoy
TEST: node node_modules/jest/bin/jest.js src/database/seeds/bootstrap-admin --runInBand --silent: 39/39, 2 suites PASS; node .ai-local/p06d_codex_checkpoint.cjs: PASS codeReads=1/nameReads=1 sin fuga.
REVIEWED_BY: Codex; Claude actual pendiente
STATUS: WAITING_CLAUDE_REVALIDATION
NEXT_ACTION: Recoger CLI sesión40303 y dictamen .ai-local/P0_6D_REVALIDATION_20261009.md. P0.7 bloqueada por cinco ciclos; P1a.1 siguiente rama elegible.
## Checkpoint actual P0.6d — 2026-10-09
TASK: P0.6d
FINDING: Revalidación Claude APROBABLE sin cambios requeridos; requisitos actuales ya implementados por AGY en ciclos históricos. validateBootstrapConfig equivale funcionalmente a parseBootstrapAdminConfig; sin renombrado cosmético.
SEVERITY: CONTROL_DE_ESTADO (resuelto); nomenclatura MENOR (aceptada)
FILE: src/database/seeds/bootstrap-admin*; .ai-work/BOOTSTRAP_ADMIN.md
FIX: Confirmar cierre previo con evidencia actual. No reimplementar.
IMPLEMENTED_BY: AGY (ciclos 1-3 históricos)
TEST: Codex Jest focalizado 39/39 PASS, 2 suites, exit0; checkpoint sanitizador PASS lecturas1/1 sin fuga. Claude checkpoint PASS, Jest no ejecutado por permisos; integración90/0 histórica no repetida.
REVIEWED_BY: Claude APROBABLE .ai-local/P0_6D_REVALIDATION_20261009.md; Codex revisión independiente código/config/tests/doc y ejecución actual APROBADO.
STATUS: APPROVED; P0.6d[x] se conserva. P0 no completo por P0.7.
NEXT_ACTION: Claude analiza SOLO P1a.1 mediante .ai-local/P1A_1_CLAUDE_REQUEST.md; después AGY implementación y Claude revisión antes checkpoint Codex. P0.7 rama bloqueada cinco ciclos, consulta de excepción pendiente; D4 consulta pendiente sin selección automática.
## P1a.1 análisis Claude — 2026-10-09
TASK: P1a.1
FINDING: F1 BLOCKER: 21 rutas de roles/menu/grupo-menu/menu-rol protegidas solo JWT. F2 IMPORTANTE: rol_id asignable por no-Administrador si se le concede guardar/editar /usuarios, incl. auth/register. F3 IMPORTANTE diferido P1a.7: /roles/:id/menus solo Admin según D3 necesita alternativa al habilitar otros roles. F4 MENOR residual: renombrar/borrar rol Administrador puede bloquear administración.
SEVERITY: BLOCKER / IMPORTANTE / MENOR según finding
FILE: cuatro controllers parámetros; usuarios.controller.ts; auth.controller.ts; roles.service.ts; consumidor BFF HandleInertiaRequests.php
FIX: Claude instruye guard explícito fail-closed y protección asignación rol_id; no endpoint nuevo ni modelo tenant. F3 verificado por Codex read-only: AuthenticatedSessionController.php:49 exige Admin antes de sesión; :71 almacena api_token; HandleInertiaRequests.php:49 llama getAsUser roles/{rolId}/menus; ApiHelper getAsUser usa clientWithToken. No regresión login actual, fuente propia pendiente P1a.7.
IMPLEMENTED_BY: AGY pendiente
TEST: Pendientes tests HTTP Nest in-memory con guards reales y repositorios fake; ninguna BD externa.
REVIEWED_BY: Claude análisis .ai-local/P1A_1_CLAUDE_ANALYSIS.md; Codex contrato BFF comprobado
STATUS: OPEN; análisis, no cierre. F3 diferido y F4 residual, no decisiones nuevas inventadas.
NEXT_ACTION: Recoger instrucciones Claude terminadas e invocar AGY solo P1a.1.
### P1a.1 — AGY implementación ciclo 1, 2026-10-09
TASK: P1a.1
FINDING: Claude completó análisis e instrucciones F1/F2; contrato BFF verificado por Codex.
SEVERITY: BLOCKER F1 / IMPORTANTE F2 (abiertos)
FILE: .ai-local/P1A_1_AGY_INSTRUCTIONS.md
FIX: AGY ejecuta guard Admin y anti-autoasignación rol_id con tests HTTP reales in-memory.
IMPLEMENTED_BY: AGY en curso CLI sesión14807
TEST: Pendientes guard/e2e/regresión focalizada/build/lint; no suites contra servicios reales.
REVIEWED_BY: Claude análisis; revisión implementación pendiente
STATUS: IMPLEMENTING_CYCLE1; principal P1a.1[ ]
NEXT_ACTION: Recoger .ai-local/P1A_1_AGY_RESULT.md y salida CLI; invocar Claude review1; hasta APROBABLE no checkpoint aprobatorio.
### P1a.1 entrega AGY y revisión Claude ciclo 1 — 2026-10-09
TASK: P1a.1
FINDING: AGY finalizó exit0. F1/F2 implementados; F3/F4 diferidos. Reporte lint/global requiere contraste reviewer: ejecutó suite global pese instrucción focalizada; no repetir.
SEVERITY: CONTROL_DE_ESTADO; desviación de alcance de tests MENOR
FILE: .ai-local/P1A_1_AGY_RESULT.md; archivos listados allí
FIX: Claude revisa entrega estable, lint y regresiones focalizadas; no cambios fuera tarea.
IMPLEMENTED_BY: AGY ciclo1 terminado
TEST: AGY declara unit5/5, e2e9/9, global67/67 en12suites y buildPASS; lint3 incidencias heredadas pendiente confirmar. Evidencia actual reviewer pendiente.
REVIEWED_BY: Claude CLI sesión34075 en curso; Codex checkpoint pendiente
STATUS: WAITING_CLAUDE_REVIEW_CYCLE1; P1a.1 principal[ ]
NEXT_ACTION: Recoger P1A_1_CLAUDE_REVIEW.md; si REQUIERE_CAMBIOS invocar AGY correcciones; si APROBABLE ejecutar p1a1_codex_checkpoint.cjs y tests correspondientes para checkpoint independiente.
### P1a.1 revisión Claude ciclo 1 — 2026-10-09
TASK: P1a.1
FINDING: Código F1/F2 correcto (guard estricto fail-closed, 21 rutas JWT→Admin, rol_id bloqueado para no-Admin en create/update/register antes del service, rol desde BD). Tests incompletos: R1 services no invocados en rechazos, R2 admin invoca service 1 vez, R3 cobertura METHOD_METADATA vs ROUTES, R4 payload rol falsificado (IMPORTANTE); R5 origen 403 F2, R6 lint tests nuevos 189E+1W e informe AGY inexacto, R7 suite global ejecutada fuera de alcance (MENOR, registrada, no repetir); R8 residual no-Admin con /usuarios editar podría alterar cuenta Admin (MENOR, decidir con P1a.7).
SEVERITY: IMPORTANTE (solo tests) / MENOR
FILE: test/p1a-1-admin-config.e2e-spec.ts; src/common/guards/administrador.guard.spec.ts
FIX: .ai-local/P1A_1_AGY_CORRECTIONS_CYCLE2.md T1-T6, solo 2 archivos de test; producto no se toca.
IMPLEMENTED_BY: AGY ciclo 2 pendiente
TEST: Claude: unit guard 5/5, e2e p1a-1 9/9, regresión src/auth+src/gestion/usuarios 5 suites 14/14, tsc --noEmit tsconfig.build exit0. Lint real sin --fix: producto 0 errores nuevos; auth.controller 2E/1W y autorizacion.module 1W preexistentes (confirmado con lintText de versión previa; hash pre-P1a.1 auth.controller = P0.7 ec4949b7). Snapshot producto inicio=final 209 archivos agregado b531a92d…d41b, staged 0.
REVIEWED_BY: Claude .ai-local/P1A_1_CLAUDE_REVIEW.md (REQUIERE_CAMBIOS); Codex checkpoint pendiente
STATUS: REQUIRES_CHANGES_CYCLE2; P1a.1 principal[ ]
NEXT_ACTION: Invocar AGY con .ai-local/P1A_1_AGY_CORRECTIONS_CYCLE2.md; luego Claude review ciclo 2; si APROBABLE checkpoint Codex.

### P1a.1 revisión Claude ciclo 1 — REQUIERE_CAMBIOS, 2026-10-09
TASK: P1a.1
FINDING: R1-R4 IMPORTANTE: tests omiten ausencia llamadas servicios en401/403, invocación exacta Admin, igualdad rutas/metadata y rol BD vs JWT. R5 MENOR origen403 rol_id/null; R6 MENOR lint189errores+1warning nuevos tests y reporte incompleto. R7 MENOR suite global fuera alcance. R8 MENOR residual gestión de cuentas Admin por noAdmin con permisos /usuarios concedidos, diferido P1a.7; F3/F4 siguen residuales.
SEVERITY: IMPORTANTE R1-R4; MENOR R5-R8
FILE: test/p1a-1-admin-config.e2e-spec.ts; src/common/guards/administrador.guard.spec.ts; .ai-local/P1A_1_AGY_RESULT.md
FIX: Instrucciones Claude .ai-local/P1A_1_AGY_CORRECTIONS_CYCLE2.md T1-T6; SOLO2tests e informe/estados. Producto aprobado por Claude, no modificar.
IMPLEMENTED_BY: AGY ciclo1 código correcto; ciclo2 pendiente
TEST: Claude actual unit5/5, e2e9/9, regresión14/14, tsc0. Lint producto0errores nuevos; auth2E/1W preexistentes. Tests nuevos189E/1W.
REVIEWED_BY: Claude .ai-local/P1A_1_CLAUDE_REVIEW.md; Codex sin cierre
STATUS: REQUIERE_CAMBIOS; principalP1a.1[ ]; no checkpoint aprobatorio
NEXT_ACTION: AGY ciclo2 T1-T6, luego Claude review2; no suite global ni producto.
2026-10-09 | P1a.1 | AGY ciclo2 T1-T6 invocado CLI43623; solo2tests e informe/estado, producto inmutable. STATUS: IMPLEMENTING_CYCLE2; NEXT_ACTION: entregaAGY2 -> Claude review2 -> Codex checkpoint. No cierre, no suite global.

### P1a.1 control de informe AGY ciclo2 — 2026-10-09
TASK: P1a.1
FINDING: Informe parcial ciclo2 declara20errores lint preexistentes/inevitables en archivos tests nuevos; clasificación preexistente no válida para archivos creados enP1a.1. T6 pide0errores; no aceptado como resuelto. AGY aún activo, esperar entrega atómica final y reviewer.
SEVERITY: MENOR (T6/reporte), pendiente criterio Claude
FILE: .ai-local/P1A_1_AGY_RESULT.md; dos tests nuevos
FIX: Corregir tipado/lint o excepciones puntuales justificadas; no etiquetas falsas ni disables amplios. Claude revalidará T6 e informe.
IMPLEMENTED_BY: AGY ciclo2 en curso
TEST: Informe parcial5unit/10e2e/14regresión PASS declarados; lint20E aún declarado, no cierre.
REVIEWED_BY: Codex control; Claude review2 pendiente
STATUS: OPEN; P1a.1[ ]
NEXT_ACTION: Recoger entrega definitivaAGY2 y revalidar Claude; no cambios de producto ni cerrar porPASS parcial.
### P1a.1 AGY2 entregado y Claude review2 — 2026-10-09
TASK: P1a.1
FINDING: AGY2 exit0 declara T1-T5 implementados y pruebas5unit/10e2e/14regresión PASS; T6 no resuelto:20E/7W lint declarados, informe los llama preexistentes/inevitables. Producto inmutable.
SEVERITY: MENOR T6/reporte pendiente Claude; R1-R4 implementación declarada no revisión final
FILE: dos tests nuevos; .ai-local/P1A_1_AGY_RESULT.md
FIX: Claude revalida T1-T6 e informe sin asumir lint inevitable.
IMPLEMENTED_BY: AGY ciclo2 terminado
TEST: Evidencia actual Claude pendiente; no suite global repetida
REVIEWED_BY: Claude CLI16951 review2 en curso
STATUS: WAITING_CLAUDE_REVIEW_CYCLE2; principalP1a.1[ ]
NEXT_ACTION: Recoger review2; si cambios instrucciones ciclo3, si APROBABLE checkpointCodex. No cerrar ni avanzar tarea antes.
### P1a.1 hallazgos Claude review2 — 2026-10-09
TASK: P1a.1
FINDING: C1 IMPORTANTE: AGY2 eliminó aserción GUARDS_METADATA de orden JWT/Admin. C2 MENOR igualdadhandlers/rutas no exacta. C3-C6 MENOR lint20E/7W nuevos solucionables; Claude demostró en memoria0E/0W y0diagnósticosTS sin disables. C7 MENOR artefacto eslint_out.json nuevo e informe clasificación falsa.
SEVERITY: IMPORTANTE C1; MENOR C2-C7
FILE: dos tests; .ai-local/P1A_1_AGY_RESULT.md; eslint_out.json
FIX: Claude instrucciones .ai-local/P1A_1_AGY_CORRECTIONS_CYCLE3.md: restaurarmetadata, tiparSupertest/ROUTES/fakes/contexto, noeslint-disable; informe veraz. Eliminar eslint_out.json solo si autoriaAGY confirmada; sin borrar ajeno.
IMPLEMENTED_BY: AGY ciclo3 pendiente; producto inmutable aprobado
TEST: Proofs en memoria .ai-local/p1a1_claude_lint_cycle3_proof.cjs y p1a1_claude_cycle3_typecheck.cjs; revisión formal y entregaCLI aún cerrándose.
REVIEWED_BY: Claude review2; Codex noaprobación
STATUS: REQUIERE_CAMBIOS_CYCLE2; principalP1a.1[ ]
NEXT_ACTION: Finalizar entrega atómicaClaude2 y AGY3 C1-C7, luego Claude3 y checkpointCodex.
2026-10-09 | P1a.1 | Claude review2 REQUIERE_CAMBIOS exit0; T1/T2/T4/T5 cerrados, R9metadataIMPORTANTE yR3/R6/R10MENOR abiertos. AGY3 CLI79130 C1-C7 solo2tests/informe/estado;0E/0W sineslint-disable, producto inmutable. STATUS: IMPLEMENTING_CYCLE3. NEXT_ACTION: entregaAGY3 -> Claude review3 -> checkpointCodex siAPROBABLE. Principal[ ], limite5 vigente.

2026-10-09 | P1a.1 | AGY3 exit0 entrega C1-C7 solo2tests/informe; declara unit5/e2e10/regresion14 PASS ylint0E/0W sin disables. Claude review3 CLI91904 invocado; evidencia pendiente revalidacion. STATUS: WAITING_CLAUDE_REVIEW3. NEXT_ACTION: recoger review3; APROBABLE -> Codexcheckpoint/script/tests focalizados; principal[ ].

## P1a.1 — Checkpoint independiente Codex APROBADO, 2026-10-09
TASK: P1a.1
FINDING: F1/F2 implementados por AGY; hallazgos R1-R6/R9/R10 corregidos y verificados Claude review3 APROBABLE. Codex confirma guards en21rutas y DI, fail-closed, bloqueo rol_id antes servicio, rol BD autoritativo frente payloadJWT y tests HTTP actuales.
SEVERITY: BLOCKER/IMPORTANTE/MENOR resueltos según historial
FILE: AdministradorGuard, AutorizacionModule, cuatro controllers parámetros, UsuariosController, AuthController, dos tests
FIX: AGY ciclos1-3; sin cambios producto en ciclos2-3.
IMPLEMENTED_BY: AGY
TEST: Codex actual: p1a1_codex_checkpoint.cjs exit0 routes21 metadata/failClosed/roleAssignment/currentRole PASS, BDexterna=false; guard5/5 y HTTP10/10 PASS. Claude review3 actual guard5/5 HTTP10/10 auth/usuarios14/14 PASS, lint0E/0W sin disables; TS0errores en2tests. Build producto AGY1PASS yClaude1tscbuild0, no producto cambiado después.
REVIEWED_BY: Claude review3 APROBABLE; Codex checkpoint independiente APROBADO
STATUS: APPROVED; principalP1a.1[x]. R7 desviación suiteglobal registrada; F3/R8 diferidos P1a.7, F4 rol renombrable residual; deuda TS bootstrap-admin.spec.ts:204 ajena aP1a.1 anotada sin nueva tarea.
GIT_STATUS: Dirty preexistente + cambiosP1a.1 preservados; cached vacío. Sin staging/commit/push/rama. QA/prod/BDpersistentes sin acceso.
NEXT_ACTION: P1a.5a elegible, dependencia mínima deP1b.3; Claude analizará con .ai-local/P1A_5A_CLAUDE_REQUEST.md y acceso read-only BFF. P0.7 sigue rama bloqueada por cinco ciclos; solicitudes D4/excepción pendientes sin respuesta.
## P1a.5a análisis Claude en curso — 2026-10-09
TASK: P1a.5a
FINDING: Codex inspección confirma ApiHelper clientWithToken actualmente solo añade JWT; hay catch genéricos en consumidores y resolveMenu que pueden ocultar401 como vacío. Tests BFF bloquean requests externas y configuran api.test; phpunit apuntaSQLite memoria/sesiónarray.
SEVERITY: IMPORTANTE (alcance análisis, pendiente instrucciones)
FILE: BFF app/Http/Helpers/ApiHelper.php; controllers consumidores; HandleInertiaRequests.php
FIX: Claude debe centralizar401 autenticado y cierre sesión, asegurando propagación hasta respuesta login sin vacío;403/publiclogin401 no equivale sesiónexpirada.
IMPLEMENTED_BY: AGY pendiente
TEST: Pendientes feature Httpfake/Auth/sesión reales; sin BDpersistente ni serviciosexternos.
REVIEWED_BY: Claude análisis CLI1922 en curso; Codex inspección contratos
STATUS: ANALYZING; P1a.5a[ ]
NEXT_ACTION: Recoger P1A_5A_CLAUDE_ANALYSIS.md/P1A_5A_AGY_INSTRUCTIONS.md; invocar AGY SOLO5a tras análisis, preservando dirtyBFF inventariado. No P1b.3 antes5a.
## Control de lectura sensible — 2026-10-09
TASK: P1a.4 / D13 (rama pendiente, sin rotación autorizada)
FINDING: Durante inspección Codex de permisos se mostró un fragmento de .claude/settings.local.json con comandos históricos que contienen literales sensibles. Lectura innecesaria con salida cruda; no repetir ni copiar valores. No se utilizaron credenciales para conectarse a servicios ni ejecutar esos comandos. LOCAL_CREDENTIALS se leyó después solo en memoria sin valores en salida.
SEVERITY: IMPORTANTE (exposición en salida de herramienta)
FILE: .claude/settings.local.json (local/untracked preexistente)
FIX: Contención de lectura: no volver a imprimir configuración sensible, no leerla para informes; evidencia y estados solo categorías/rutas sin valores. Rotación/revocación/purga de historial/logs sujeta a D13/P1a.4 y no ejecutada. No modificar archivo ajeno de permisos.
IMPLEMENTED_BY: Codex contención de lectura; respuesta operativa pendiente D13
TEST: No nuevas lecturas crudas ni copia de valores en prompts/Markdown; sin conexiones a BD/QA/prod.
REVIEWED_BY: Codex
STATUS: CONTAINED_READ; HUMAN_DECISION_REQUIRED D13 para respuesta operativa. Continuar ramas independientes sin secretos.
### P1a.5a hallazgos análisis Claude — 2026-10-09
TASK: P1a.5a
FINDING: F1/F2 BLOCKER: sin manejo401 JWT y catches genéricos loocultan. F3 IMPORTANTE:401 menú ocurre antescontroller. F4/F5 IMPORTANTE: separar403/login/APIkey401 y respuesta302/303 oJSON401. F6 MENOR tokenfaltante; F7 residualremember a5c; F8 MENOR reutilizarcierreslocales. F9 IMPORTANTE precondicionpruebas: cacheconfig ausente ypdo_sqlite verificado antes tests. F10 observadoPIIlogs/registersinconsumidor fueraalcance.
SEVERITY: SegúnF1-F10 en .ai-local/P1A_5A_CLAUDE_ANALYSIS.md
FILE: BFF ApiHelper.php; middlewareweb nuevo; bootstrap/app.php; logout actual si helper compartido
FIX: Marca por request + ApiSessionExpiredException en clientWithToken + middleware TerminateExpiredApiSession interior a Inertia que cierreAuth/sesion/tokenCSRF y descarterespuestatragada; otrostatus/autenticacion conserva comportamiento. Noendpointnuevo ni P1b.3 entero.
IMPLEMENTED_BY: AGY pendiente instruccionesfinales
TEST: PendientesT1-T13 Httpfake/SQLite memoria; Codex ya inventarió gitstatusBFFreadonly, dirtypreexistente preservado.
REVIEWED_BY: Claude análisis; Codex contrasteApiHelper/TestCase/phpunitcontratos
STATUS: OPEN_ANALYSIS; P1a.5a[ ]; ninguna decisiónnueva bloqueante
NEXT_ACTION: Recoger AGY_INSTRUCTIONS final y CLIClaude1922; verificarprecondiciones pruebas, invocarAGY solo5a luegoClaude review/checkpoint.
2026-10-09 | P1a.5a | Claude análisis FINAL: .ai-local/P1A_5A_CLAUDE_ANALYSIS.md F1-F10 + .ai-local/P1A_5A_AGY_INSTRUCTIONS.md C1-C5/T1-T13 entregados. Sin cambios producto API/BFF, sin tests ejecutados (análisis). Git API inicio=fin idéntico, cached0; git BFF desde Claude requirió aprobación no concedida (snapshot BFF = inventario Codex). STATUS: ANALYSIS_DONE; P1a.5a[ ]. NEXT_ACTION: Codex verifica precondiciones F9 vía AGY e invoca AGY solo5a; luego Claude review.
### P1a.5a F9 precondiciones verificadas Codex — 2026-10-09
TASK: P1a.5a
FINDING: F9 riesgo config cacheada/SQLite no disponible comprobado read-only antes pruebas.
SEVERITY: IMPORTANTE (precondición resuelta)
FILE: BFF bootstrap/cache/config.php; extensiónPHPpdo_sqlite; phpunit.xml
FIX: No se limpiócache ni modificó.env. Cacheconfig inexistente; pdo_sqlite=yes. Baseline36archivosPHP enP1A_5A_CODEX_BFF_BASELINE.json.
IMPLEMENTED_BY: Codex comprobaciónlocal
TEST: Test-Pathconfigcache=False; php extension_loadedpdo_sqlite=yes; ningunaBDconectada.
REVIEWED_BY: Codex
STATUS: VERIFIED_PRECONDITION; AGY debe mantenerSQLite memoria/Httpfake y no usar.envreal.
NEXT_ACTION: EntregaClaudeinstrucciones -> AGY5a -> review -> checkpoint.
2026-10-09 | P1a.5a | Claude análisis/instrucciones entregados exit0. AGY CLI70963 implementación BFF archivos permitidos, --add-dir, Httpfake/SQLite memoria. F9 Codex verificado configcacheFalse/pdo_sqliteyes; AGY revalida. P0.7/D4 siguen pendientes respuesta. STATUS: IMPLEMENTING_CYCLE1; NEXT_ACTION: recoger P1A_5A_AGY_RESULT.md y luego Claude review1, Codexcheckpoint siAPROBABLE. Principal[ ]; sin Gitwrite/BDpersistente/QA/prod.
### P1a.5a implementación AGY completada — 2026-10-09
TASK: P1a.5a
FINDING: Implementación F1-F8 completada en BFF en archivos permitidos. Se crearon/modificaron: ApiSessionExpiredException, ApiHelper, TerminateExpiredApiSession, LocalSessionTerminator, bootstrap/app.php y AuthenticatedSessionController. Precondiciones (pdo_sqlite, sin config cache) reverificadas. Tests pasaron correctamente usando Http::fake y SQLite en memoria, preservando estado dirty previo. Se arreglaron desajustes en URLs fake (ej: /pais en vez de /parametros/pais) para coincidir con las peticiones de ApiHelper y payloads de array vacío que fallaban validación 302. Se respetó el dominio de Inertia (303 en métodos no GET/HEAD).
SEVERITY: N/A (Implementación)
FILE: BFF archivos modificados según instrucciones.
FIX: Lógica 401 contenida, logout local y redirección 401 completados. P1A_5A_AGY_RESULT.md generado. Sin Git staging/commits ni interacción con BD/QA/prod ni secrets.
IMPLEMENTED_BY: AGY ciclo 1
TEST: ApiHelperTest (9/9), ApiSessionExpirationTest (14/14), AuthenticationTest y UsuarioControllerTest (7/7) pasando con éxito.
REVIEWED_BY: AGY
STATUS: WAITING_CLAUDE_REVIEW_CYCLE1; P1a.5a[ ]
NEXT_ACTION: Handoff a Claude para review ciclo 1 de la implementación. Principal permanece [ ] hasta APROBABLE + Codex checkpoint.

### P1a.5a entrega AGY y review Claude ciclo1 — 2026-10-09
TASK: P1a.5a
FINDING: AGY exit0 entregó8archivos permitidos yreporta9helper/14expiración/7regresión PASS; ajustó fakes/payloads T4/T5/T9 a contratos reales sinproductoextra. PrecondicionesSQLite/cache verificadas por AGY yCodex.
SEVERITY: BLOCKER/IMPORTANTE F1-F5 implementados pendientesreview
FILE: .ai-local/P1A_5A_AGY_RESULT.md; 8archivosBFF listados
FIX: Interceptor401JWT+marcarequest+middleware+terminador compartido ypruebas.
IMPLEMENTED_BY: AGY ciclo1 terminado
TEST: ReporteAGY9/14/7 PASS yphp-l0errores; evidenciaclaudeactualpendiente.
REVIEWED_BY: Claude CLI94556 revisiónciclo1 en curso
STATUS: WAITING_CLAUDE_REVIEW_CYCLE1; P1a.5a[ ]
NEXT_ACTION: Recoger P1A_5A_CLAUDE_REVIEW.md; correcciones AGYsiREQUIERE_CAMBIOS, checkpointCodexsiAPROBABLE. No cerrar5a ni empezarP1b.3 antes.
### P1a.5a review Claude ciclo1 — 2026-10-09
TASK: P1a.5a
FINDING: Código producto conforme C1-C5 (marca request, callback401 soloJWT, token faltante/marca previa sin HTTP, middleware interior a Inertia antes/después de $next, terminador compartido con destroy, 302 GET/HEAD-303 resto, JSON401 no-Inertia, dontReport). Tests: R1 T7 vacuo (fake /parametros/departamento vs real /departamento → stray, no prueba APIkey401) IMPORTANTE; R2 T12 usa Log mock y ruta con catch, no prueba dontReport ni usa assertLogsDoNotContainSecrets IMPORTANTE; R3 T4 acepta302 y flash key errónea, R4 T10 sin cookie recaller expirada, R5 T13 sin componente/status MENOR; R6 APIkey tras marca no cortada NOTED; F7/F10 residuales.
SEVERITY: IMPORTANTE (R1,R2 solo tests)
FILE: BFF tests/Feature/ApiSessionExpirationTest.php
FIX: Ciclo2 AGY solo ese test según .ai-local/P1A_5A_AGY_CORRECTIONS_CYCLE2.md; producto sin cambios.
IMPLEMENTED_BY: AGY ciclo2 pendiente
TEST: Claude NO ejecutó tests/lint/F9/git BFF/hash: permisos CLI denegaron php, node, git -C BFF y Get-FileHash. Conteos 9/9,14/14,7/7 y lint0 = autoinforme AGY no verificado. Git API inicio=fin idéntico.
REVIEWED_BY: Claude ciclo1 (.ai-local/P1A_5A_CLAUDE_REVIEW.md)
STATUS: REQUIERE_CAMBIOS; P1a.5a[ ]
NEXT_ACTION: Codex ejecuta F9 + 3 phpunit focalizados + php -l y hashes vs baseline (script .ai-local/p1a5a_claude_snapshot.cjs); AGY ciclo2 tests; Claude review2; checkpoint Codex pendiente.
## P1a.5a Claude review1 REQUIERE_CAMBIOS + validación Codex actual — 2026-10-09
TASK: P1a.5a
FINDING: R1 IMPORTANTE T7 fake APIkey apunta URL BFF incorrecta y acepta500/200, no prueba401real. R2 IMPORTANTE T12 mocklogger no prova logs reales/dontReport. R3-R5 MENOR303POSTexacto/flash, cookie remember expirada, Auth/Login+status. R6-R7 residuales fueraalcance. Producto considerado APROBABLE estático, no modificar en ciclo2. ClaudeCLI denegóejecución dePHP/git/hashBFF; no inventóresultados.
SEVERITY: IMPORTANTE R1/R2; MENOR R3-R7
FILE: BFF tests/Feature/ApiSessionExpirationTest.php; .ai-local/P1A_5A_AGY_RESULT.md
FIX: Claude .ai-local/P1A_5A_AGY_CORRECTIONS_CYCLE2.md SOLOtestexpiracion; informe+estados. R1fakesexactos/headerAPIkey, R2loggerreal sinmock yPOSTsincatch, R3-5asercionesexactas.
IMPLEMENTED_BY: AGY ciclo1 producto; ciclo2 pendiente
TEST: Codex trasF9 cacheFalse/pdo_sqliteyes: phpunit4clasesfocalizadas30/30PASS152aserciones, exit0; desglose9helper14expiracion5auth2usuarios. PHP-l8archivosPASS. Hashbaseline4existentescambiados+4nuevospermitidos. Checks actuales NO cubrenR1/R2 correctamente, no cierre.
REVIEWED_BY: Claude REQUIERE_CAMBIOS .ai-local/P1A_5A_CLAUDE_REVIEW.md; Codex ejecuciónactual e inspecciónscope, checkpointaprobatorio pendiente
STATUS: REQUIERE_CAMBIOS_CYCLE1; P1a.5a[ ]
NEXT_ACTION: AGY2 corrigeR1-R5 solo1test, luegoCodexejecucióntestsnuevos/evidencia paraClaude2; Claude2revalida yAPROBABLEantescheckpointfinalCodex.
2026-10-09 | P1a.5a | AGY2 CLI57706 implementando SOLO R1-R5 enApiSessionExpirationTest.php; producto inmutable. Codex baselineactual30/30PASS152aserciones/8PHP-lPASS, falsa cobertura no cierre. STATUS: IMPLEMENTING_CYCLE2; NEXT_ACTION: entregaAGY2 -> Codexejecuciónevidencia actual -> Claude review2 -> CodexcheckpointfinalsiAPROBABLE. No P1b.3 antescierre5a.
2026-10-09 | P1a.5a | Ciclo 2 completado. R1-R5 corregidos en ApiSessionExpirationTest.php. Pruebas exitosas (14/14 tests, 82 assertions en la clase modificada). A la espera de review2 de Claude.

## P1a.5a validación actual Codex tras AGY2 — 2026-10-09
TASK: P1a.5a
FINDING: AGY2 exit0 corrigióR1-R5 solo testexpiración; Codex ejecutó4clases foco actuales con nueva cobertura y guardóJUnit/snapshot40archivos.
SEVERITY: IMPORTANTE R1/R2 implementados pendienteClaude2; MENOR R3-R5 idem
FILE: BFF tests/Feature/ApiSessionExpirationTest.php; P1A_5A_CODEX_CYCLE2_TESTS.xml; P1A_5A_CODEX_CYCLE2_SNAPSHOT.json
FIX: PruebasR1-R5 corregidas porAGY2; sin relajaraserciones ni cambiarproducto.
IMPLEMENTED_BY: AGY2
TEST: Codex actual F9 cacheFalse/pdo_sqliteyes; phpunit4clases30/30 PASS172aserciones exit0 (9helper/14expiración/5auth/2usuarios). TestPHP-lPASS; snapshot40hashes. Baseline4archivosexistentesmodificados+4nuevos dentroalcance. PHPUnitXML guardado como evidencia actual, sin valores privados.
REVIEWED_BY: Codex ejecuciónindependiente, Claude2 pendiente revisión semántica
STATUS: VALIDATED_PENDING_CLAUDE_REVIEW2; no checkpointaprobatorio ni xprincipal
NEXT_ACTION: Claude2 lee códigoR1-R5 yJUnit/evidencia actual; siAPROBABLE checkpointfinalCodex confirmasnapshotestable y cierre. SiREQUIERE_CAMBIOS AGY3, límite5.
2026-10-09 | P1a.5a | Claude review2 CLI37773 activo, revalidación R1-R5 con evidenciaCodex30/30PASS172aserciones/JUnit/snapshot40archivos. STATUS: CLAUDE_REVIEW_CYCLE2; NEXT_ACTION: recoger dictamen; APROBABLE -> Codexhashestable/checkpointfinal/cierre; cambios -> AGY3. Principal[ ].

## P1a.5a review Claude ciclo2 — 2026-10-09
TASK: P1a.5a
FINDING: R1-R5 cerrados (T7 fakes /departamento 401 + X-API-KEY + 500 exacto + sesión intacta; T12 logger real sin mock, POST sin catch 303, nivel≠error/sin secretos → dontReport probado; T4 303+flash/status; T10 recaller reenviado + assertCookieExpired + token rotado; T13 Auth/Login+status+sentCount1). R8 MENOR nuevo: variante GET de T12 vacua (corre como invitado tras logout del POST) y listener propio sin context en vez de assertLogsDoNotContainSecrets; riesgo práctico nulo.
SEVERITY: MENOR (R8, no bloqueante)
FILE: BFF tests/Feature/ApiSessionExpirationTest.php
FIX: Ninguno en 5a; R8 opcional en tarea futura que toque el test (P1b.3).
IMPLEMENTED_BY: AGY ciclo2
TEST: JUnit Codex 30/30 PASS 172 aserciones; snapshot Claude read-only 40/40 hashes idénticos a CODEX_CYCLE2_SNAPSHOT, config_cache false. Claude no ejecutó phpunit (archivo byte-idéntico al ejecutado).
REVIEWED_BY: Claude ciclo2 (.ai-local/P1A_5A_CLAUDE_REVIEW.md, sección review2)
STATUS: APROBABLE; P1a.5a[ ] hasta checkpoint Codex
NEXT_ACTION: Codex checkpoint final (snapshot estable + cierre). Sin ciclo 3.

## P1a.5a checkpoint final Codex — APROBADO, 2026-10-09
TASK: P1a.5a
FINDING: AGY ciclos1-2 terminó. Claude review2 APROBABLE cerróR1-R5 y confirmó40hashes contra versión probadaCodex. CheckpointCodex independiente posterior confirma snapshot40/40estable, drift0 ycacheconfigFalse; mecanismosJWT401/localAuth/session/CSRF/remember/redirects cumplencontrato. R8MENOR no bloqueante: varianteGET deT12 ya sinsesión y chequeomensajessincontexto, diferidoP1b.3. No afirmar cobertura completa deesa variante.
SEVERITY: BLOCKER/IMPORTANTE F1-F5/R1-R2 resueltos; MENORR3-R5resueltos; R8residualaceptado
FILE: 8archivos BFF listados enP1A_5A_AGY_RESULT.md; .ai-local/P1A_5A_CLAUDE_REVIEW.md
FIX: AGY interceptorJWT401+marca/middleware/terminador local ytests; Codex confirmóefectosrealesyestabilidad.
IMPLEMENTED_BY: AGY ciclos1-2
TEST: Codex actual30/30PASS172aserciones (9ApiHelper14expiración5auth2usuarios), F9cacheFalse/pdo_sqliteyes, PHP-l8archivosPASS ytestmodificadoPASS. JUnit P1A_5A_CODEX_CYCLE2_TESTS.xml; snapshot40/40stable. No suites contra runtime/BDpersistente/QA/prod.
REVIEWED_BY: Claude review2 APROBABLE + Codex checkpoint independiente APROBADO
STATUS: APPROVED; P1a.5a[x]. PrincipalP1a.5[ ] ysubtareas5b-fpendientes. P1b.3 dependencia5a desbloqueada; P1bnoiniciado.
NEXT_ACTION: P1b.1 siguiente elegible segúnTASKS, análisisClaude mediante .ai-local/P1B_1_CLAUDE_REQUEST.md. DespuésAgy/Claude/Codex. No inventar ni saltar P1b.2 paraP1b.4.

TASK: P1a.5a
FINDING: AGY2 dejó su informeGit enraízBFF fueraárealocal prevista.
SEVERITY: MENOR (artefacto documental, sinproducto)
FILE: BFF P1A_5A_AGY_GIT_AFTER_C2.txt
FIX: Codex trasladó archivo propioAGY conMove-Item -LiteralPath, rutasabsolutasvalidadas, sin sobrescribir ni borrarsourceajeno, aAPI.ai-local/P1A_5A_AGY_GIT_AFTER_C2_BFF_RECOVERED.txt. Acción fuera raíz requirió escalación del sandbox, autorizada.
IMPLEMENTED_BY: Codex
TEST: Moveexit0; productonoalterado; snapshotPHPprevio40drift0.
REVIEWED_BY: Codex
STATUS: CLOSED
## CORTE VIGENTE — CODEX_CONTEXT_LIMIT — 2026-10-09
STATUS: CODEX_CONTEXT_LIMIT (handoff preventivo; operaciones atómicas terminadas)
COMPLETED: P0.6d revalidada, conserva[x]; P1a.1[x] (AGY3/Claude3/Codex); P1a.5a[x] (AGY2/Claude2/Codex).
IN_PROGRESS: Orquestación global, P1b/P1c todavía sin implementar. Ningún CLI de esta ejecución pendiente; todos terminaron naturalmente. No cerrar terminales/procesos ajenos.
BLOCKED: P0.7 HUMAN_DECISION_REQUIRED/FIVE_CYCLES_EXHAUSTED. Excepción de sexto ciclo solicitada por herramienta asíncrona, sin respuesta; NO interpretarla como autorizada. D4 solicitada, sin respuesta; persona-documentos sigue bloqueada. D5/D7/D9/D13 pendientes en sus ramas; aspectos D6 no definidos y migración multiempresa mantienen sus dependencias reales.
RESUME_FROM: Invocar Claude real en sesión nueva para analizar SOLO P1b.1 con .ai-local/P1B_1_CLAUDE_REQUEST.md y --add-dir C:/Users/nfueg/OneDrive/Documents/Developer/sis-iva-frontend. Leer primero protocolo/handoff/machinepaths/history/TASKS/SYSTEM_STATE y git status de ambos; NO reauditar ni reimplementar P0.6d/P1a.1/P1a.5a. Después Claude instrucciones -> AGY -> Claude revisión/correcciones hasta APROBABLE -> Codex checkpoint -> cierre. P1b.2 después; P1b.3 ahora elegible por5a; P1b.4 depende2; P1b.5 D4; P1b.6 sin decisiones inventadas. Si rama bloqueada seguir independientes. P1c solo según dependencias y decisiones, sin integrar padrón D9 por cuenta propia.
TESTS: Codex bootstrap39/39 ysanitizadorPASS; P1a.1 guard5/5 HTTP10/10 checkpoint21rutasPASS; Claude regresión14/14/lint0E0W. P1a.5a Codex actual30/30PASS172aserciones, PHP-l8archivosPASS, F9 cacheFalse/pdo_sqliteyes, snapshot40/40 sin drift; JUnit yvalidación en.ai-local/P1A_5A_CODEX_CYCLE2_* y P1A_5A_CODEX_FINAL_CHECKPOINT.md.
RESIDUALES: P1a.1 F3/R8 aP1a.7, F4 renombrado rol; errorTS bootstrap-admin.spec.ts:204 registrado sin nueva tarea. P1a.5a R8 varianteGET testlogs no alcanzaAPI y no inspecciona contexto, MENOR aceptado/diferidoP1b.3; F7 remember a5c; APIkey401 puede500 y conserva sesión, futuroP1b.3. No afirmar pruebas de contexto completas. R1-R5 cerrados Claude2.
SECURITY: Una lectura Codex de settings.local.json mostró un literal sensible en salida de herramienta. Contención y hallazgo registrados sin valores bajoD13/P1a.4. NO volver a imprimir settings.local.json ni credenciales/.env/logs privados; no copiar secretos ni ejecutar comandos de permisos históricos. Rotación/purga requiereD13, no realizada. LOCAL_CREDENTIALS leído en memoria sin salida de valores para su lectura requerida.
ENVIRONMENTS: Solo tests aislados Nest yLaravel/SQLite en memoria con Httpfake ypreventStrayRequests; no BD persistente/QA/prod, no servidores ni escrituras de schema.
GIT: Ramaa1 en ambos, dirty preexistente preservado + cambios aprobados; index vacío, sin staging/commit/push ni operaciones prohibidas. InformeGit accidental deAGY2 enraízBFF trasladado con rutasvalidadas aAPI.ai-local/P1A_5A_AGY_GIT_AFTER_C2_BFF_RECOVERED.txt; ningún archivo ajeno eliminado. fix_r1.ps1 conservado y no ejecutado.
TOKEN/CONTEXT: Codex corte preventivo de contexto. Claude yAGY usaron sesiones nuevas por ciclo, sin señales de truncamiento/tokenlimit. No inventar conteos de tokens CLI no disponibles.
NEXT_ACTION exacta: claude --add-dir C:/Users/nfueg/OneDrive/Documents/Developer/sis-iva-frontend -p 'Lee y ejecuta .ai-local/P1B_1_CLAUDE_REQUEST.md' --permission-mode acceptEdits --output-format text (con mecanismo de escalación ya usado si red/sandbox lo requiere).
LAST_UPDATE: 2026-10-09T12:31:37.9203717-03:00

FINAL_GIT_STATUS: API dirty 91 paths; BFF dirty 24 paths; cached API=0/BFF=0. Rama a1, sin staging/commit/push. Cambios preexistentes conservados. Detalle .ai-local/FINAL_GIT_STATUS_20261009.txt; informe accidental BFF retirado de raíz y preservado en.ai-local. NEXT_ACTION: P1b.1 análisis Claude; CODEX_CONTEXT_LIMIT.

GIT_READ_CORRECTION: git -C desde sandbox API falló dubious ownership; el conteo BFF0 derivado fue inválido. Reejecutado git status ydiffcached en workdirBFF: exit0, BFF dirty 24 paths, cached=0. Sin git config ni operaciones de escritura. Reporte final corregido. STATUS: CODEX_CONTEXT_LIMIT; RESUME_FROM: P1b.1 análisisClaude.

2026-10-31T14:30:00-03:00 | MODEL_GUIDE: análisis Claude + redacción AGY con correcciones de Codex; P1b.1–P1b.3 [x] preservadas; D17 reemplazada sin equipos. Estado posterior: servicio gestionado inicial sin cargo/LIBRE total; después SaaS pagado, posible cuota ligada a usuarios que cargan facturas (Q1 aplazada; medición/precio no definidos); Q2 unión real vs gestión conjunta pendiente; Q3 respondida por pedido explícito de instalación/migración/recorrido local. Docs ampliadas por Codex ante indisponibilidad de AGY y Claude; falta revisión Claude/cierre G1. G2–G4 sin ejecutar; código/BD multiempresa aún no implementados.

### Checkpoint continuación — 2026-10-31
- Documentación comercial/instalación ajustada a las dos etapas; `.ai-local/model_guide_codex_check.ps1` PASS: 7 documentos UTF-8 sin BOM/LF, 9 bloques PowerShell parsean con 0 errores, 6 documentos fuera de alcance intactos, snapshot BFF 116/116 sin drift, P1b.1–3 siguen [x].
- No hay cambios de producto ni migraciones: `src/database/migrations/` conserva solo `.gitkeep`; no se ejecutó DB/test/install.
- Intentos actuales Claude análisis y AGY M0 se interrumpieron sin resultados; ninguna entrega de esos agentes se acredita. G1 sigue pendiente de revisión Claude; G2–G4 no ejecutados.
- Próximos bloques M0–M4 permanecen [ ]: migración inicial MariaDB 11.8; modelo tenant; aislamiento API; BFF/frontend; instalación limpia/E2E local. MySQL 8 no se usa para validar MariaDB y Docker Engine local no está iniciado.
