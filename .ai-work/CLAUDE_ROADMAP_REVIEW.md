# .ai-work — Índice y revisión crítica del roadmap

Carpeta de trabajo de agentes (excluida de git vía `.git/info/exclude`). No es documentación del producto.

## Índice de documentos

| Archivo | Qué contiene | Fecha |
|---|---|---|
| `API_AUDIT.md` | Auditoría funcional de la API (evidencia por archivo:línea, P0–P3) | 2026-09-26 |
| `API_STATE.md` | Estado resumido de la API | 2026-09-26 |
| `FRONTEND_AUDIT.md` | Auditoría estática del frontend, hallazgos F01–F12 | 2026-09-30 |
| `SYSTEM_STATE.md` | Estado integrado API + frontend y decisiones pendientes | 2026-09-30 |
| `TASKS.md` | Roadmap provisional integrado (el que se revisa abajo) | 2026-09-30 |
| `README.md` | Este archivo: índice y revisión crítica de `TASKS.md` | 2026-09-30 |

Regla vigente: cuando `CLAUDE.md`, `API_ENDPOINTS.md`, `SISTEMA_IVA_GUIA.md` o `GOOGLE_OAUTH_SETUP.md` contradicen `.ai-work`, prevalece `.ai-work`.

---

## Revisión crítica de TASKS.md — 2026-09-30

Alcance: solo revisión del roadmap. No se re-auditó código, no se ejecutó build/lint/tests, no se modificó código, no hubo commit ni push. Única verificación nueva: `git ls-files` para confirmar qué documentos están versionados.

### 1. Riesgos de orden que cambian el plan (lo más importante)

**R1 — Habilitar Google en P0 abre registro público antes de arreglar permisos.**
Según `CLAUDE.md §7`, `findOrCreateGoogleUser()` crea automáticamente un usuario con rol Contador (id=2) para cualquier cuenta Google. Según API_AUDIT P1.1, `/roles`, `/menu`, `/grupo-menu` y `/menu-rol` solo exigen JWT: cualquier autenticado puede darse permisos. Juntas, la tarea P0 "OAuth disponible cuando configurado" más la tarea P1 de permisos aún pendiente permiten que cualquier persona con cuenta Google escale a administrador.
→ En P0 hacer solo "arranca sin Google". Prohibir configurar credenciales Google en cualquier entorno hasta cerrar permisos administrativos y definir la política de alta (ver D2). Pasar "vinculación de identidad / no autocrear" de P2 a P1.

**R2 — Los tests están después de las tareas que los necesitan.**
Cada tarea de seguridad de P1 pide "pruebas negativas" como criterio de aceptación, pero reparar la base de tests (24/31 suites fallan por aliases, e2e no arranca, BFF sin `Http::fake`) figura cuarta dentro de P1. El roadmap API original la ponía #3.
→ Mover la infraestructura mínima de tests a P0.

**R3 — Varias tareas de P1 dependen de migraciones, pero no lo dicen.**
Índices únicos fiscales, asociados en ventas, timbrados, planes y auditoría cambian el schema. Sin la tarea P0 de migraciones no hay forma reproducible de aplicarlos.
→ Declarar la dependencia explícita en cada una. Además falta un paso: **detectar y depurar duplicados existentes antes de crear índices únicos**, o el `ALTER` falla en BD con datos.

**R4 — El visor de imagen (P1) choca con "R2 protegido" (P2).**
Si el visor de la bolsa se construye sobre URLs públicas de R2 y después se privatiza el bucket, hay que rehacer el visor.
→ Decidir el modelo de acceso a R2 (por ejemplo, URLs firmadas) antes del visor y subir esa parte de P2 a P1.

**R5 — RG90 está en P1 sin su prerequisito.**
La guía describe 17 campos y el código genera 14. No hay evidencia del formato vigente aceptado por Marangatu.
→ Primero una tarea "obtener la especificación oficial y un archivo de ejemplo aceptado" (D8). Además RG90 depende de la máquina de estados (qué estados son exportables = "aptitud") y del aislamiento (las exportaciones hoy no verifican asignaciones).

**R6 — Hay credenciales en documentación versionada.**
`CLAUDE.md` está trackeado en git (remoto GitHub) y contiene credenciales del admin inicial y de prueba. La tarea de secretos de TASKS.md solo cubre logs, emails y props.
→ Agregar esto al alcance de la tarea de secretos: quitar las credenciales de los docs versionados y rotarlas en todo entorno que las use. No se copian valores aquí.

**R7 — CLAUDE.md engaña a los agentes.**
Lo cargan todas las sesiones y afirma cosas que la auditoría refutó: bolsa protegida contra concurrencia, filtros funcionales, RG90 exacto, 22 tablas, persona-documentos completo. Corregirlo está en P2 ("README/CLAUDE coherentes").
→ Una corrección mínima (marcar esas afirmaciones como falsas y apuntar a `.ai-work`) es barata y conviene hacerla en P0.

### 2. Prioridades incorrectas

| Tarea | Está en | Propuesta | Motivo |
|---|---|---|---|
| ApiKeyGuard fail-closed | P2 | P0 | Cambio de pocas líneas. Hoy permite el acceso si faltan `API_KEY` y el header (reproducido). El BFF usa API key para catálogos. |
| Login rechaza usuarios inactivos | P2 (dentro de "tokens atómicos… inactivos") | P0 | `validateUser()` emite tokens sin comprobar `activo`: es un bug puntual, no parte de un rediseño de sesión. |
| Quitar BCC fijo del SMTP y las líneas de log F01 | P1 (mezclado con hashes) | P0 | Son fugas activas que se cierran borrando líneas. No hace falta esperar a la sanitización completa. |
| Frontend F04 (12 rutas + 6 redirects) | P1 "Contratos" | Quick win inicial de P1 | Mecánico, independiente y sin decisiones. Hoy provoca reintentos ambiguos tras persistir. |
| DTOs de filtros API | P1 | Temprano en P1 | Chico y desbloquea bolsa, compras/ventas, suscripciones, cuotas y asignaciones. |
| Bug del SuscripcionGuard (ausencia, morosidad, trial NULL, cancelada histórica) | Enterrado en la mega-tarea SaaS de P1 | Tarea propia en P1 | Es un defecto del guard actual y se corrige sin decidir planes ni precios. |
| Modelo SaaS completo (planes → límites → cuotas → balance → renovación) | P1 | Fase propia, después del flujo contable y de D11 | No es parte del recorrido imagen → revisión → RG90, y está bloqueado por decisiones comerciales. |
| Redis/BullMQ | P2 obligatorio | P2 condicional | Reutilizar workers Tesseract y limitar concurrencia (P3) es más barato. Medir primero y usar cola solo si el OCR síncrono no alcanza. |
| Dashboard con métricas | P2 | P3 / opcional | No bloquea producción y su alcance no está definido. |
| Swagger | P2 | Opcional | Ya existen `API_ENDPOINTS.md` y la colección Postman. Lo necesario es corregirlos, no sumar otra fuente. |

### 3. Tareas duplicadas o solapadas

| Duplicado | Dónde | Propuesta |
|---|---|---|
| Ciclo de tokens y sesiones | P1 "refresh, vencimiento, remember, logout remoto/revocación y revalidación rol/activo" + P2 "rotación/consumo atómico, revocación tras cambio/reset, inactivos" | Una sola tarea "Sesión y tokens" en P1, dividida en subtareas (ver §4). |
| Manejo de errores BFF | P1 F06 "errores visibles" + P1 F11/F12 "errores Nest string/array y mensajes de campo" + P2 F11 "feedback global y validación por campo" | Una tarea P1: manejo centralizado en ApiHelper (vacío / 400 / 401 / 403 / caída, mensajes Nest string o array). Una tarea P2: feedback por campo y flash global en la UI. |
| Estados y transiciones de comprobantes | P1 "reglas unificadas… estados" + P1 "bolsa… responsable/transiciones" + P1 RG90 "aptitud" | Definir una sola máquina de estados (D6), implementarla una vez y que bolsa y RG90 la consuman. |
| OAuth | P0 "Google opcional" + P2 "OAuth seguro sin tokens en URL, callback frontend" | P0: arranque sin Google. Luego una tarea única "OAuth integrado" condicionada a D2 (si se descarta Google, se elimina). |
| Timbrados | P1 "administración timbrados y asociados" + P1 "reglas unificadas… identidad fiscal" | Separar gestión de timbrados (entidad y vigencia) de la validación de comprobantes. Hoy ambas tareas los tocan sin límite claro. |

### 4. Tareas demasiado grandes (dividir)

1. **"Permisos administrativos y aislamiento de cada recurso"** es en realidad tres tareas:
   a) proteger `/roles`, `/menu`, `/grupo-menu` y `/menu-rol` (chica, depende de D3);
   b) decidir el modelo de actores (D1);
   c) aislamiento por contribuyente, un módulo a la vez: compras, ventas, bolsa, exportaciones, asignaciones.
   La (a) se puede hacer ya. La (c) depende de D1.
2. **"Quitar hashes… logs… BCC… exposición histórica"** son cuatro tareas:
   a) cortar fugas: BCC y logs F01 (P0);
   b) serialización sin `password` en la API (`@Exclude`/DTO de salida), incluida la relación en asignaciones;
   c) proyección de props en el BFF (F02);
   d) respuesta operativa: revocar refresh tokens, forzar cambio de las contraseñas enviadas en texto por email, purgar logs y rotar credenciales documentadas (R6).
3. **"Sesión y tokens"** (fusionada):
   a) 401 centralizado en ApiHelper y cierre de sesión local;
   b) refresh desde el BFF;
   c) política de remember;
   d) logout que revoque en la API;
   e) rotación y consumo atómicos en la API;
   f) revocación tras cambio o reset de contraseña.
4. **"Esquema/migraciones/bootstrap"**:
   a) baseline versionado desde la BD actual (21 tablas, sin datos);
   b) tooling de migraciones TypeORM;
   c) seed de catálogos y menús con las URLs correctas (no las del SQL viejo);
   d) bootstrap del admin por variable de entorno o CLI, sin credenciales fijas.
5. **"Tests focalizados"**:
   a) `moduleNameMapper` y resolución de e2e;
   b) borrar los smoke tests `should be defined` que no validan nada, en lugar de mockear 24 suites;
   c) BFF con `Http::fake` + `preventStrayRequests`;
   d) desactivar el scaffolding de Breeze que no aplica.
   A partir de ahí, cada tarea agrega sus propios tests.
6. **"Documentos/RUC/DV normalizados, timbrados y asociados"**:
   a) normalizar RUC/DV;
   b) asociados en EditForm/update de compras (fix de frontend);
   c) asociados en ventas (migración + API + UI);
   d) gestión de timbrados (depende de D7).
7. **"Reglas unificadas + índices únicos"**:
   a) definir la clave fiscal de duplicado (D5);
   b) validador único usado por manual, OCR y update (cuadratura y recálculo);
   c) script de detección de duplicados existentes;
   d) migración de índices únicos;
   e) UI que refleje los errores.
8. **"OCR"**:
   a) validador: dato faltante ⇒ `REQUIERE_REVISION`, sin fecha por defecto = hoy, confianza real de Vision;
   b) carga del padrón `set_rucs` (depende de D9), porque hoy está vacío y todo queda "A CONFIRMAR";
   c) orden R2 / validación y compensación;
   d) helper multipart con JWT en el BFF;
   e) pantalla de carga.
9. **"RG90"**:
   a) especificación oficial (D8);
   b) corregir el builder (5 %, exentas, escape, DV, tipo de identificación);
   c) filtro por estado exportable (D6);
   d) aislamiento en exportaciones;
   e) descarga en el frontend.
10. **"SaaS"**:
    a) fix del guard actual;
    b) D11;
    c) planes;
    d) vigencia;
    e) límites concurrentes;
    f) cuotas y balance;
    g) generación y renovación idempotentes.

### 5. Tareas posiblemente innecesarias

- **Persona-documentos standalone (F05).** Las personas ya gestionan documentos de forma anidada, que sí funciona. Antes de implementar un CRUD completo en ambas capas, evaluar si alcanza con retirar la ruta BFF y el menú id=14 (D4). Si se retira, la tarea se reduce a borrar código.
- **Reparar los 24 smoke tests.** Mockear dependencias para que `should be defined` pase no agrega cobertura; conviene borrarlos (ver §4.5).
- **OAuth completo en P2.** Si D2 descarta Google en esta etapa, alcanza con eliminar la estrategia, los endpoints y `GOOGLE_OAUTH_SETUP.md`.
- **Redis/BullMQ y Swagger:** condicionales u opcionales (ver §2).
- **Entrenamiento OCR real:** TASKS ya lo marca como opcional; se mantiene en P3.

### 6. Decisiones funcionales necesarias antes de programar

Marcadas por la tarea que bloquean. Las **D1, D2, D3 y D6 bloquean P1** y conviene resolverlas primero.

| # | Decisión | Bloquea |
|---|---|---|
| D1 | Quiénes inician sesión: solo Administrador, también Contador, ¿contribuyente? ¿Multirrol? Hoy el frontend filtra por el literal "Administrador". | Aislamiento, filtro de rol del BFF, rol por defecto de Google, alcance de la bolsa |
| D2 | Google OAuth: ¿se mantiene? ¿Autoalta o solo vincular usuarios existentes? ¿Con qué rol? | R1, tarea OAuth |
| D3 | Protección de endpoints de configuración: MenuRolGuard (el seed ya da a Administrador permisos sobre menús 7–10) o chequeo de rol admin. Cómo se hace el bootstrap del primer admin. | Permisos administrativos |
| D4 | Persona-documentos: ¿CRUD independiente o solo anidado? | F05 |
| D5 | Clave fiscal de duplicado para compras y ventas (ventas sin `ruc_cliente`), y qué hacer con los duplicados existentes | Índices únicos |
| D6 | Máquina de estados `estado_ocr`: transiciones válidas, quién transiciona, si se puede editar un comprobante VERIFICADO y qué estados se exportan | Reglas, bolsa, RG90 |
| D7 | Timbrados: ¿entidad administrada por contribuyente o solo campos? ¿La vigencia bloquea o solo advierte? | Timbrados, validación |
| D8 | Especificación RG90 vigente (14 o 17 campos, tipo de identificación, DV) y archivo de ejemplo aceptado | RG90 |
| D9 | Fuente y frecuencia de actualización del padrón SET de RUC | OCR, razón social |
| D10 | Acceso a imágenes: bucket privado + URLs firmadas, con TTL | Visor, R2 |
| D11 | Planes, precios, límites, trial, morosidad y renovación | Fase SaaS |
| D12 | Volumen esperado de OCR (define si hace falta cola) | Redis/BullMQ |
| D13 | Respuesta a exposición histórica de secretos: ¿qué se rota o revoca? | Secretos (§4.2 d) |
| D14 | Registro/exportación o emisión electrónica; detalle por ítems | P3 |
| D15 | Alcance del dashboard | Dashboard |

### 7. Roadmap ajustado propuesto

Orden sugerido. Sigue siendo provisional y **no autoriza implementación**.

**Fase 0 — Decisiones:** D1, D2, D3, D6 (mínimo). D4, D5, D7 y D8 antes de sus tareas.

**P0 — Arranque, contención y base de trabajo**
1. API: arranque sin Google (estrategia condicional). No configurar credenciales hasta P1.1 + D2.
2. Cortar fugas activas: BCC fijo, logs F01, contraseña en texto en el email de bienvenida.
3. ApiKeyGuard fail-closed y login que rechaza inactivos.
4. Frontend: `.env.example` e instrucciones (F12).
5. Tests mínimos: aliases/e2e, borrar smoke tests, BFF con HTTP simulado.
6. Baseline de schema, migraciones y bootstrap admin sin credenciales fijas.
7. Docs: quitar credenciales de `CLAUDE.md` y demás docs versionados, y marcar las afirmaciones refutadas apuntando a `.ai-work` (R6, R7).

**P1a — Seguridad**
1. Proteger endpoints de configuración (D3).
2. Serialización sin hash en la API + proyección en el BFF.
3. Respuesta a exposición histórica (D13).
4. Sesión y tokens (§4.3, fusiona la tarea P2).
5. Aislamiento por contribuyente, un módulo a la vez (D1).
6. OAuth: vinculación y callback sin tokens en URL, o eliminación (D2).

**P1b — Contratos y navegación**
1. F04 rutas y redirects.
2. DTOs de filtros en la API.
3. Manejo de errores centralizado en ApiHelper (fusiona los tres ítems de errores).
4. Paginación remota que conserva filtros.
5. Persona-documentos según D4.
6. Alta atómica de persona/contribuyente (F08).

**P1c — Integridad fiscal**
1. RUC/DV.
2. Máquina de estados (D6).
3. Validador único manual/OCR/update.
4. Duplicados: detección → depuración → índices únicos (D5, requiere P0.6).
5. Asociados: edición de compras y luego ventas (con migración).
6. Timbrados (D7).

**P1d — Flujo OCR → revisión → RG90**
1. Validador OCR.
2. Padrón (D9).
3. Orden R2 y compensación.
4. Modelo de acceso a R2 (D10).
5. Carga OCR en el frontend.
6. Bolsa con reclamo atómico, revisor y visor.
7. Especificación RG90 (D8) → builder → filtro de estado → descarga.

**P1e — Suscripción (sin modelo comercial)**
1. Corregir el SuscripcionGuard actual.

**P2 — Antes de producción**
1. Auditoría persistente, idealmente diseñada junto con la máquina de estados.
2. SMTP trazable con reintentos.
3. Timeouts y configuración validada.
4. Observabilidad.
5. Invalidar menú al cambiar permisos.
6. Feedback de UI por campo.
7. Compatibilidad Inertia.
8. Responsive y accesibilidad.
9. Documentación coherente, lint y CI.
10. Medición de OCR → decidir cola (D12).

**Fase SaaS (tras D11)**
1. Planes.
2. Vigencia.
3. Límites concurrentes.
4. Cuotas y balance.
5. Renovación idempotente.

**P3 — Optimización y opcional**
1. Workers Tesseract.
2. Pipeline compartido y consultas.
3. Retiro de código heredado; relación inversa de ventas.
4. Dashboard (D15).
5. Swagger.
6. Entrenamiento OCR.
7. Ítems / emisión (D14).

### 8. Cambios propuestos a TASKS.md (pendientes de aprobación)

Sin aplicar. Si se aprueban:
- Reemplazar las secciones P0–P3 por el §7.
- Agregar una sección "Decisiones" con D1–D15 y su estado.
- En cada tarea, agregar una línea `Depende de:` y otra `Decisión:` cuando corresponda.
- Eliminar el ítem P2 de tokens (fusionado en P1a.4) y los dos ítems de errores duplicados (fusionados en P1b.3).
