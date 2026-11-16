# Modelo Multiempresa, Acceso sin Equipos y Modos Comerciales (`TENANCY_COMMERCIAL_MODEL`)

Fecha: 2026-10-31.

## 1. Estado y precedencia

- **Estado**: especificación y consolidación **solo documental**; **no implementada** en el código de la API (`Facturacion-IVA`), ni en el BFF (`sis-iva-frontend`), ni en la base de datos.
- **Precedencia**: prevalecen `.ai-work/TASKS.md` y `.ai-work/SYSTEM_STATE.md`. Este documento reemplaza las referencias históricas a equipos (D17) de `.ai-local/MULTITENANCY_DESIGN.md` y `.ai-local/QA_SEED_PLAN.md`.
- **Alcance de ejecución**: el usuario autorizó completar instalación limpia, configuración, migración y recorrido **exclusivamente en entorno local aislado**. No tocar QA ni producción.

## 2. Existente (código actual verificado)

| # | Aspecto | Estado actual en el código | Ruta de evidencia |
|---|---|---|---|
| E1 | Tenancy / Empresa / Equipos | En `src/` no existen entidades ni referencias a `empresa`, `equipo` ni `tenant` (0 archivos). El sistema actual **no es multiempresa**. | `src/` (`src/app.module.ts`) |
| E2 | Clientes asignados por usuario | Ya existe la tabla `asignaciones_contables(usuario_id, contribuyente_id)` con claves foráneas `CASCADE`, sin vínculo a una empresa. | `src/negocio/asignaciones-contables/entities/asignacion-contable.entity.ts` (líneas 13–30) |
| E3 | Suscripción y modelo comercial | La entidad `Suscripcion` está asociada a `contribuyente_id` (`suscripciones`), con `estado` (`EstadoSuscripcion`), `es_trial` y `trial_hasta`. No existen los modos `PAGO`/`LIBRE`/`FREE` ni un catálogo de planes. | `src/negocio/suscripciones/entities/suscripcion.entity.ts` (líneas 15–45) |
| E4 | Esquema y migraciones | El directorio `src/database/migrations/` está vacío; `npm run migration:run` sobre una base de datos vacía no crea las tablas del negocio. El único esquema existente en el repositorio es el snapshot histórico de MySQL 8. | `src/database/migrations/`, `src/database/data-source.ts`, `database/baseline/0000-current-schema-mysql8.sql` |

## 3. Decisiones confirmadas y vigentes

### 3.1 Confirmadas por el usuario en este corte

- **C-1 — Etapas y modos comerciales**: al inicio el propietario gestionará los documentos/facturas de sus clientes sin cobrar el uso del sistema (`LIBRE` total). Más adelante se ofrecerá acceso directo pagado; se evaluará una cuota asociada a usuarios que cargan facturas, con medición/precio pendientes. `FREE` con límites queda como posibilidad futura, sin cupos inventados.
- **C-2 — Sin equipos (D17 reemplazada)**: se eliminan conceptualmente `equipos` y `equipo_miembros`. El acceso granular se define por el rol del usuario en la membresía (`Administrador`, `Contador`, `Solo Lectura`) y los clientes (`contribuyentes`) asignados **por usuario**. El usuario no pidió overrides individuales de permisos por encima del rol (`menu_rol`). Cualquier detalle técnico de permisos finos queda como pendiente de diseño técnico en `MIGRACIÓN MULTIEMPRESA`, sin abrir nuevas preguntas al usuario.
- **C-3 — Escenario multiempresa A y B**: escenario con administradores y contadores de la empresa A y de la empresa B (además del rol Solo Lectura de D1 y la membresía en una o múltiples empresas ya definida en D16).
- **C-4 — Posibilidad de unir empresas**: debe contemplarse la unión de empresas (sujeta a la decisión **D24 / Q2 PENDIENTE** y a los requisitos previos de la sección 6).
- **C-5 — Guía limpia de operación y QA**: la documentación se acompaña de `.ai-work/OPERATIONS_QA_GUIDE.md` con precondiciones, variables, instalación local aislada, puertas reales de bloqueo y recorrido QA no ejecutado.

### 3.2 Estado de las decisiones D16–D24 y D11

| Decisión | Estado | Definición vigente |
|---|---|---|
| D11 | **PARCIAL** | Primera etapa: servicio gestionado sin cargo para los clientes, concedido como `LIBRE` total (sin límites comerciales). Después se ofrecerá operación directa pagada del sistema. La cuota/unidad de cobro (se evaluará por usuario que carga facturas), precios, períodos y límites opcionales de `FREE` quedan pendientes; no bloquean el tenant base. |
| D16 | **DEFINIDA** | Membresía usuario–empresa (un usuario pertenece a una o múltiples empresas). Objetivo ya establecido; no requiere volver a preguntarse al usuario. |
| D17 | **REEMPLAZADA (2026-10-31)** | **Sin equipos.** El acceso granular dentro de cada empresa se gestiona por el rol en la membresía y por clientes (contribuyentes) asignados por usuario. |
| D18 | **DEFINIDA + restricción** | Contribuyente global más cartera por empresa (`empresa_contribuyente`). La asignación usuario→contribuyente solo puede apuntar a contribuyentes de la cartera de esa empresa. Ningún modo comercial ni coincidencia de email, alias `+tag` o RUC habilita acceso entre empresas. |
| D19 | **DEFINIDA + restricción** | Todo comprobante pertenece explícitamente a una empresa (tenant). El modo `LIBRE` (ni ningún otro modo comercial) **no desactiva** el aislamiento por empresa ni la validación empresa↔contribuyente. |
| D20 | **ETAPAS DEFINIDAS; detalle comercial aplazado** | El servicio inicial es gestionado y sin cargo en `LIBRE` total. En una etapa posterior, el uso directo del sistema será pagado; se evaluará cobrar por usuario que carga facturas, pero el precio, periodicidad y medición exacta están pendientes (Q1). Q1 no bloquea empresas, membresías ni aislamiento. |
| D21 | **DEFINIDA (ajustada)** | Dataset QA multiempresa reproducible **sin equipos**, con placeholders de correo y escenarios A/B. |
| D22 | **DEFINIDA** | Administrador de Plataforma (alcance global sobre `/roles`, `/menu`, `/grupo-menu`, `/menu-rol` y concesión de `LIBRE`) vs Administrador de Empresa (acotado a su empresa). |
| D23 | **DEFINIDA** | Motor objetivo MariaDB 11.8.x (MySQL 8 local solo como referencia histórica). |
| D24 | **PENDIENTE (Q2)** | Unión de empresas: definir si corresponde a una **fusión real** de datos o a una **gestión conjunta** (**Q2 PENDIENTE**), y aprobar el plan previo de 5 requisitos (§6). |

## 4. Modelo objetivo propuesto (sin equipos)

1. **Empresa como frontera estricta de aislamiento**:
   - Toda consulta, alta, edición, revisión OCR o exportación RG90 opera dentro del contexto de una empresa activa.
   - Ninguna operación de negocio de la empresa A puede leer ni mutar registros de la empresa B.
2. **Membresía usuario–empresa con rol (D16)**:
   - Un usuario se vincula a una o más empresas mediante una membresía que define su rol en esa empresa (`Administrador` de empresa, `Contador`, `Solo Lectura`) y su estado activo.
   - Los permisos de navegación y acción provienen del rol (`menu_rol`). No existen equipos (`equipos` / `equipo_miembros`) ni se solicitaron overrides individuales de permisos por encima del rol; si durante `MIGRACIÓN MULTIEMPRESA` se requiere algún refinamiento técnico de permisos finos, se resolverá como diseño técnico sin nuevas preguntas bloqueantes al usuario.
3. **Cartera `empresa_contribuyente` (D18)**:
   - El contribuyente (RUC) existe como entidad fiscal, pero cada empresa administra su propia cartera a través de la relación `empresa_contribuyente`.
4. **Asignación usuario→contribuyente acotada a la empresa (D17 reemplazada + D18)**:
   - Dentro de una empresa, los clientes (`contribuyentes`) se asignan directamente **por usuario**.
   - Una asignación usuario→contribuyente solo es válida si el contribuyente pertenece a la cartera `empresa_contribuyente` de esa misma empresa.
5. **Comprobantes alineados con empresa y contribuyente (D19)**:
   - Cada comprobante de compra o venta referencia tanto a la empresa (tenant) como al contribuyente, exigiendo que el par `(empresa, contribuyente)` pertenezca a la cartera de la empresa.
6. **Etapas comerciales y modos (`PAGO`, `LIBRE`, `FREE`)**:
   - Para la primera etapa, el Administrador de Plataforma concede `LIBRE` total a la operación gestionada sin cargo; esto no limita el diseño ni el aislamiento multiempresa.
   - En la etapa SaaS, la operación directa del sistema será pagada. El usuario indicó evaluar una cuota sobre los usuarios que cargan facturas. La unidad contractual final, medición, precio y periodicidad quedan pendientes en Q1/D11; mantenerlos configurables y no activar cobros antes de definirlos.
   - `FREE` con límites queda como opción futura; sus cupos no están definidos.
7. **Invariantes innegociables de aislamiento (D18 y D19)**:
   - **El modo `LIBRE` no anula el aislamiento**: `LIBRE` exime de límites comerciales de consumo, pero mantiene intactos el aislamiento por empresa (D19), la pertenencia a la cartera `empresa_contribuyente` y las asignaciones por usuario (D18).
   - **Identidad o RUC coincidente no cruza empresas**: compartir un mismo RUC en las carteras de A y B, o usar correos relacionados / alias `+tag`, jamás habilita acceso cruzado entre la empresa A y la empresa B.
8. **Diseño físico diferido a `MIGRACIÓN MULTIEMPRESA`**:
   - Este documento no fija nombres de columnas nuevas ni sentencias DDL; el diseño de esquema y su migración versionada para MariaDB 11.8.x pertenecen a la tarea `MIGRACIÓN MULTIEMPRESA`.

## 5. Modos comerciales (D11 parcial)

| Modo | Definido (confirmado por el usuario) | Pendiente (bloqueado por Q1 y D11) |
|---|---|---|
| `PAGO` | Modalidad futura para operación directa del sistema. El usuario indicó que deberá pagarse para que funcione y que se evaluará una cuota ligada a usuarios que cargan facturas. | Unidad, medición, catálogo de planes, precios, moneda, períodos, trial, morosidad, suspensión y renovación (Q1/D11 pendientes). |
| `LIBRE` | Modalidad inicial para la operación gestionada sin cargo; acceso sin límites comerciales, concedido por Administrador de Plataforma. Respeta íntegramente el aislamiento por empresa y cartera (D18/D19). | Trazabilidad persistente de concesión/revocación (P2.1). |
| `FREE` | Posible modalidad gratuita futura sujeta a límites de uso; no es el servicio gestionado inicial. | Qué dimensiones limita, valores de cupos y período de reinicio (D11 pendiente; prohibido inventarlos). |

## 6. Unión de empresas (D24 — PENDIENTE por Q2)

### 6.1 Pregunta de definición (Q2 — PENDIENTE)

Está **PENDIENTE (Q2)** que el usuario defina cuál de los dos modelos corresponde a "unir empresas":
- **Alternativa 1 — Fusión real de datos**: una empresa absorbe a otra (la cartera, los comprobantes, las asignaciones y los antecedentes operativos pasan a una única empresa resultante).
- **Alternativa 2 — Gestión conjunta**: un mismo usuario (administrador o contador) administra u opera ambas empresas mediante membresías en la empresa A y en la empresa B (D16), conservando cada empresa sus datos y su frontera de aislamiento por separado.

### 6.2 Requisitos previos obligatorios antes de ejecutar cualquier unión

Sea cual sea la respuesta a **Q2**, ninguna operación de unión de empresas puede implementarse ni ejecutarse hasta contar con:
1. **Plan de no-conflictos aprobado**: reglas explícitas para (a) contribuyentes con el mismo RUC presentes en ambas carteras, (b) usuarios con membresía en ambas empresas, (c) roles distintos entre empresa origen y destino, (d) asignaciones contables duplicadas y (e) suscripciones o modos comerciales divergentes (según Q1/D11). En cuanto a comprobantes de compra o venta que pudieran colisionar, la clave fiscal y el tratamiento de duplicados dependen de **D5 (PENDIENTE)**: este documento solo inventaría la categoría de conflicto, sin definir política de duplicados.
2. **Inventario completo de referencias**: relevamiento de todas las tablas y recursos que apuntan a la empresa o a su cartera: `comprobantes` (compras), `comprobantes_ventas`, `asignaciones_contables`, `suscripciones`, `cuotas`, `ocr_entrenamientos` y objetos almacenados en Cloudflare R2 (**D10 PENDIENTE**).
3. **Auditoría y trazabilidad (P2.1)**: registro persistente de quién autorizó y ejecutó la unión, fecha/hora, mapeo `empresa_origen → empresa_destino` y preservación del identificador de cada operador histórico en comprobantes y revisiones.
4. **Simulación local y criterio de reversión**: prueba previa en una base de datos temporal local aislada verificando conteos antes y después, pruebas negativas de aislamiento respecto de una tercera empresa no involucrada y procedimiento de reversión definido **antes** de ejecutar.
5. **Restricción de entorno**: prohibido ejecutar en QA o en producción sin una tarea separada y explícitamente autorizada.

## 7. Decisiones pendientes y tratamiento de observaciones del análisis (Q1–Q7)

### 7.1 Preguntas reales al usuario (PENDIENTES)

Solo **Q1 y Q2** siguen pendientes para fases futuras:

| # | Pregunta al usuario | Estado | Qué bloquea |
|---|---|---|---|
| Q1 | Para el SaaS pagado, cuota por usuario que carga facturas, por empresa u otra unidad; definir cómo medirla | **APLAZADA** | Fase SaaS; no bloquea tenant/membresías/aislamiento ni la gestión inicial sin cargo |
| Q2 | "Unir empresas", ¿es una **fusión real** de datos (A absorbe a B) o una **gestión conjunta** (un usuario opera ambas y cada una conserva sus datos)? | **PENDIENTE** | D24, el plan de unión (§6.2) y el recorrido QA de unión de empresas |

### 7.2 Observaciones Q4–Q7 del análisis de Claude (NO son nuevas preguntas bloqueantes al usuario)

Por directriz de coordinación (Codex), las observaciones Q4–Q7 planteadas en `.ai-local/MODEL_GUIDE_CLAUDE_ANALYSIS.md` quedan registradas con el siguiente estado sin generar nuevas preguntas bloqueantes al usuario:

| # | Observación del análisis | Estado / Resolución documental |
|---|---|---|
| Q4 | Quién concede el modo `LIBRE` | **Resuelta por definición del usuario (no pendiente):** el Administrador de Plataforma concede `LIBRE` total al servicio gestionado inicial sin cargo. |
| Q5 | Permisos asignados por usuario sin equipos | **Resuelta por definición del usuario / diseño técnico (no pregunta al usuario):** el usuario indicó roles (`Administrador`/`Contador`, más `Solo Lectura` de D1) y asignaciones de clientes por usuario sin equipos, sin pedir overrides individuales sobre `menu_rol`. Cualquier detalle técnico de permisos finos queda como **pendiente de diseño técnico** en `MIGRACIÓN MULTIEMPRESA`. |
| Q6 | Administradores/contadores de A y B distintos o compartidos | **Cubierta por D16 DEFINIDA (no pendiente):** el modelo objetivo D16 ya soporta tanto usuarios propios de cada empresa como un usuario con membresía en múltiples empresas. |
| Q7 | Qué límites, valores y períodos aplica `FREE` | **PENDIENTE dentro de D11:** forma parte de la decisión **D11 (PENDIENTE)**; no se inventan cupos ni períodos. |

## 8. Propuestas técnicas no decididas (requieren aprobación)

Las siguientes propuestas de diseño se registran únicamente como opciones técnicas sujetas a revisión y **requieren aprobación** antes de implementarse:
- **P-1 (Atributo de acceso comercial — diseño SaaS futuro)**: representar separadamente el estado inicial gestionado `LIBRE` y la futura suscripción pagada; no reutilizar `es_trial`/`trial_hasta` como un "trial indefinido" para `LIBRE`. La unidad exacta de pago se decidirá en Q1 antes de activar cobros.
- **P-2 (Auditoría de concesión y revocación de `LIBRE` — requiere aprobación)**: registrar en la auditoría persistente (P2.1) el actor (`Administrador de Plataforma`), la fecha/hora y el motivo cada vez que se otorgue o revoque el modo `LIBRE`.
- **P-3 (Control concurrente de límites `FREE` — requiere aprobación)**: verificar los cupos del modo `FREE` (una vez definidos en D11) de manera transaccional y concurrente en línea con la tarea **S.3** de la Fase SaaS.

## 9. Impacto en el dataset reproducible de QA (D21 — sin equipos)

Todos los correos electrónicos en documentos versionables o de `.ai-work` deben utilizar exclusivamente **placeholders** (nunca correos ni alias reales):

1. **Empresas de prueba**:
   - `Empresa QA A` (RUC ficticio A).
   - `Empresa QA B` (RUC ficticio B).
   - **Sin equipos** en ninguna empresa (D17 reemplazada).
2. **Usuarios y membresías (placeholders)**:
   - Administrador de Plataforma global (D22): `<email-admin-plataforma>`.
   - Empresa A: Administrador `<email-admin-empresa-a>`, Contador `<email-contador-empresa-a>`, Solo Lectura `<email-lectura-empresa-a>`.
   - Empresa B: Administrador `<email-admin-empresa-b>`, Contador `<email-contador-empresa-b>`.
   - Usuario con doble membresía en A y B (según D16 definida): `<email-contador-multiempresa-ab>`.
   - Usuario inactivo para prueba negativa de login (P0.3): `<email-usuario-inactivo>`.
3. **Carteras y asignaciones por usuario (D18)**:
   - Contribuyente `C1` en la cartera de `Empresa QA A`, asignado a `<email-contador-empresa-a>`.
   - Contribuyente `C2` en la cartera de `Empresa QA B`, asignado a `<email-contador-empresa-b>`.
   - Contribuyente `C_COMPARTIDO` (mismo RUC registrado en la cartera de `Empresa QA A` y en la cartera de `Empresa QA B`) para probar que ninguna consulta ni exportación de A expone comprobantes de B sobre ese RUC (D18/D19).
4. **Modos comerciales (`PAGO`, `LIBRE`, `FREE`) y unión de empresas**:
   - El seed inicial reproduce servicio gestionado sin cargo (`LIBRE` total); los modos SaaS `PAGO`/`FREE` y límites solo se incorporarán al definirse la oferta (Q1/D11).
   - El caso de prueba de unión de empresas se definirá una vez respondida **Q2 / D24 (PENDIENTE)** y aprobado el plan de la sección 6.2.
