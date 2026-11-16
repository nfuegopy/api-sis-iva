# Estado del sistema — 2026-09-30

## Reanudación

Auditoría API terminada previamente y NO repetida. Fuentes: API_AUDIT.md y API_STATE.md (2026-09-26), FRONTEND_AUDIT.md (2026-09-30), TASKS.md (roadmap integrado). No implementar sin nueva autorización. No hubo commit/push.

API: Facturacion-IVA, NestJS 11/TypeORM/MySQL; referencia auditada a1, bba7f5e16867274093671eaccb8cdee2683305ae. Compilación/tests/BD documentados son resultados históricos, no comprobaciones repetidas hoy.

Frontend: ../sis-iva-frontend, Laravel 12 + Vue 3/Inertia/PrimeVue 4; a1, 8da67315bb8e94c4eb126d907bb87e035b2be402. Cambios preexistentes preservados: package-lock.json modificado y .claude/ sin seguimiento. API también tenía .claude/ sin seguimiento. Solo se escribieron los tres documentos solicitados en .ai-work.

## Conclusión funcional

Existe una base administrativa de registro tributario con CRUD manual y API OCR/exportación parcial. No está completo el recorrido cargar imagen → revisar con evidencia → exportar RG90, ni un SaaS multicliente seguro. Frontend permite solo Administrador; asignar contadores no habilita su login. Pantallas CRUD no certifican integridad, autorización u operación.

| Capacidad | Estado integrado |
|---|---|
| Acceso | Parcial; secretos en logs frontend, sin refresh/logout remoto; Google bloquea entorno API auditado |
| Administración | Pantallas existentes; autorización API rota y hashes sin sanitizar en BFF |
| Catálogos/documentos | Rutas de acciones erróneas; persona-documentos falla en ambas capas |
| Contribuyentes/asignaciones | Parcial; aislamiento incompleto y alta inline no atómica |
| Compras/ventas | CRUD manual; filtros fallidos ocultos, paginación truncada e integridad pendiente |
| OCR/revisión | API defectuosa; carga UI ausente; reclamo/edición sin visor ni garantías de transición |
| RG90 | Exportador API incorrecto; sin descarga frontend |
| Cobranza | Suscripciones/cuotas manuales; sin planes/límites/balance/renovación integral |
| Operación | Migraciones API pendientes; frontend sin env.example; pruebas insuficientes y sin auditoría de negocio |

## Prioridad

1. Arranque/instalación: Google y esquema API; plantilla de configuración frontend.
2. Seguridad: autorización/aislamiento, sanitización, logs y ciclo BFF/JWT antes de ampliar acceso.
3. Contratos/navegación: rutas, documentos, filtros, errores visibles y paginación; tests pequeños con HTTP simulado.
4. Integridad de personas/comprobantes/timbrados y revisión autorizada; luego conectar OCR y exportación corregidos.
5. Modelo comercial completo; robustez operativa/colas/observabilidad y optimización.

TASKS detalla aceptación/dependencias; orden no equivale a autorización.

## Decisiones pendientes

- Solo administración o acceso contador/contribuyente; ownership y asignaciones.
- Registro/exportación o emisión; detalle por ítems si se requiere.
- Planes/precios/límites/trial/morosidad/renovación.
- Formato RG90 aceptado, proveedores, entornos y despliegue.
- Alcance dashboard y entrenamiento OCR real (no existe por guardar correcciones).

## Verificación y límites

Hoy se inspeccionó exclusivamente frontend y se contrastó con documentos API. 66 SFC compilados en memoria sin errores; cruce estático de rutas/renders confirma problemas. No build completo, suites pesadas, navegador, consultas de negocio ni servicios externos. No se leyeron .env/logs ni copiaron secretos. No se confirmó que el servidor actual coincida con la API auditada.

Al retomar elegir tarea autorizada y consultar evidencia Fxx o API existente. Verificar únicamente el contrato/caso afectado, sin reiniciar auditoría completa.

## Decisiones Adicionales (P0.6a)
- **D16 (Membresía usuario-empresa):** Un usuario pertenece a una o múltiples empresas (tenant raíz).
- **D17 (Equipos):** Se define un modelo de equipos dentro de una empresa para asignar accesos granulares.
- **D18 (Contribuyente global + cartera empresa_contribuyente):** El contribuyente existe globalmente, pero la relación con la empresa se gestiona mediante una tabla pivot (`empresa_contribuyente`).
- **D19 (Tenant en comprobantes):** Todo comprobante debe estar asociado explícitamente al tenant (empresa) para garantizar aislamiento de datos en consultas.
- **D20 (Suscripción por empresa):** La facturación, planes y límites operan a nivel de la Empresa, no del usuario ni del contribuyente individual.
- **D21 (Dataset QA multiempresa):** QA debe probarse con un seed multiempresa para asegurar que las reglas de aislamiento funcionan desde el inicio.
- **D22 (Administrador Plataforma vs Empresa):** Administrador de Plataforma es global; Administrador de Empresa está limitado a su tenant.
- **D23**: Motor objetivo de base de datos = \MariaDB 11.8.x\. Motivo: QA/Hostinger ya opera sobre MariaDB 11.8.9 y la producción estará en esa misma infraestructura. MySQL 8 local queda documentado solo como histórico actual.

## INCIDENTE P0.6b — QA
Durante una validación anterior de `migration:show`, TypeORM creó accidentalmente en QA la tabla estándar `migrations`.
- Estado: Existe, tiene estructura estándar TypeORM, 0 filas, ninguna migration aplicada.
- Impacto funcional: Nulo.
- Observación: QA tiene temporalmente 22 tablas en lugar de las 21 históricas.
- Acción correctiva: NO borrar ni modificar esa tabla ahora. La BD QA se recreará completamente desde cero más adelante para ejecutar una prueba limpia del ciclo completo, momento en el cual la tabla será eliminada naturalmente.

## Deuda técnica menor (no bloqueante)
- Reemplazar `process.exit` por `throw` en configuraciones si se desea mejorar testabilidad.
- Validar formalmente si `MIGRATION_DB_PORT` es numérico.
- Revisar el patrón de migrations en compilado (`dist`) para prevenir la carga de `.d.ts`.
- Mejorar redacción general de `SYSTEM_STATE.md`.
- Validar runtime real contra MariaDB 11.8 local cuando exista un entorno disponible.

## P0.6c — Seed de catálogos (COMPLETADO 2026-10-02)
- Seed versionable de catálogos implementado: `npm run seed:catalogs` (`src/database/seeds/run-seed.ts` + `catalogs.seed.ts`). Documentación: `SEED_CATALOGS.md`.
- Contenido: 3 roles (Administrador, Contador, Solo Lectura), 5 grupos de menú, 17 menús, 37 `menu_rol` (Administrador 17 con LGED completo; Contador 12; Solo Lectura 8, solo listar). Idéntico campo por campo al catálogo actual de QA (leído READ-ONLY).
- Claves naturales: rol por `nombre`, grupo por `nombre`, menú por `url`, `menu_rol` por (`rol_id`, `menu_id`); las cuatro son UNIQUE físicas en baseline y QA.
- Idempotencia comprobada: segunda ejecución sin duplicados y filas idénticas; sin TRUNCATE/DELETE/DROP. Exit code 0 en éxito, 1 en error.
- Protección anti-QA: solo `SEED_DB_*` (sin fallback a `DB_*`), allowlist local, bloqueo de `*.hstgr.io` y de la BD QA, sin override.
- Validación real: BD temporal en MySQL 8.0.44 local creada desde el baseline, seed ejecutado dos veces y BD eliminada. QA no modificada.
- `package-lock.json` limpio: frente a HEAD solo cambia `dotenv` (18.0.5 + copias anidadas); sin `sqlite3` ni `mariadb`; binarios multiplataforma (`sharp`, `css-inline`) preservados; `npm ci` limpio sin errores.
- Limitación conocida: aún no probado en MariaDB 11.8 real.
- Deuda menor (no bloqueante):
  - el seed no usa transacción;
  - campos `undefined` (`grupo_menu.descripcion`/`icono`, `menu.descripcion`) no se fuerzan;
  - permisos `menu_rol` extra existentes no se eliminan;
  - `@emnapi/runtime` aparece como extraneous en `npm ls`: comportamiento preexistente en HEAD, no bloqueante.
- Próximo paso: P0.6d — bootstrap controlado del primer Administrador de Plataforma (no iniciado).

## Seguridad bootstrap — actualización 2026-10-08 (P0.6d COMPLETADA)
- Bootstrap implementado con parser puro tipado, bcrypt.hash explícito10 y transacción Persona/Usuario; validado por Claude en BD temporal local (90 comprobaciones PASS), login AuthService real y cleanup confirmados. No depender del hook para garantizar hashing.
- Deuda técnica pendiente: **P1a.9** hook BeforeInsert de Usuario omite hashing para plaintext con prefijo bcrypt; afecta potencialmente alta normal. Registrada, NO implementada.
- Deuda técnica pendiente: Validación en runtime real contra MariaDB 11.8 local cuando exista entorno disponible.
- QA no accedida durante esta sesión; producción prohibida; bd_sis_iva no modificada.

## Punto de aprobación P0.6d — 2026-10-08
- Checkpoint FINAL independiente Codex: **APROBADO**. Claude ciclo3 APROBABLE validado (corrección O1 snapshot único sanitizador, 39 tests PASS, build exit 0). P0.6d cerrada documentalmente por AGY. Siguiente paso: P0.7 (Docs versionados) y Guía.


## Estado durable al corte 2026-10-08
P0.6d permanece COMPLETADA con hashing explicito y validacion local aprobada. P0.7 sigue SIN APROBACION: limpieza de credenciales comprobada y quinta entrega documental disponible, pendiente review semanticoClaude5/checkpointCodex. .ai-work conserva precedencia; documentos historicos no equivalen a capacidades P1 implementadas. Guia operativa final y P1 aun no iniciadas. Riesgo de exposicion historica Git queda enD13/P1a.4; deuda hook normalUsuarios enP1a.9. QA/produccion sin intervencion. Detalles de ciclos y resume viven TASKS/HANDOFF, no este estado.

## Limitación documental vigente — 2026-10-08
P0.7 no aprobada trasreview5; requiere decisión humana por límite de ciclos. Los documentos históricos actuales tienen codificación degradada y notas técnicas incorrectas; prevalece .ai-work. P0 queda11/12; no afirmarP0COMPLETE. No diseño/productcode/deploy nuevo. Skillscomunitarias descargadas como herramientas futuras, no auditoría externa realizada. Configuración local actual usa destinos remotos; startuprequiereoverrideslocales antes de pruebas, sin modificar valores privados en esta sesión.


## Confirmación bootstrap 2026-10-09
P0.6d conserva cierre: Claude revalidó requisitos actuales APROBABLE; Codex confirmó 39/39 tests actuales y checkpoint sanitizador. Parser puro tipado se llama parseBootstrapAdminConfig, funcionalmente cumple validación solicitada. No nuevos cambios de producto ni BD. P0.7 sigue bloqueada tras cinco ciclos; tareas independientes autorizadas pueden continuar respetando TASKS.

## Restricción de administración de permisos — P1a.1 COMPLETADA 2026-10-09
Las21rutas de roles/menu/grupo-menu/menu-rol requieren JWT válido y rol actual Administrador mediante AdministradorGuard fail-closed. Alta de usuarios y auth/register, y update con rol_id, exigen Administrador antes de persistir; permisos menu_rol concedidos a otro rol no habilitan asignación de privilegios.
AGY implementó, Claude review3 APROBABLE y Codex checkpoint independiente APROBADO. HTTP con guards/JwtStrategy reales y persistencia simulada confirma401/403 sin llamadas de escritura y Admin2xx; claims del token no sustituyen rol actual. Sin cambios de schema ni BD.
Contrato BFF actual compatible (login soloAdmin). P1a.7 debe resolver fuente de menú autenticado para otros roles y política de gestión de cuentas Administrador; no endpoint nuevo implementado aquí. Renombrar/eliminar rolAdministrador permanece riesgo residual conocido. Error TS ajeno en bootstrap-admin.spec.ts:204 registrado; build producto y Jest focalizado pasan.

## Respuesta operativa de seguridad pendiente
D13/P1a.4 sigue pendiente. Además de exposición histórica documentada, archivos locales de permisos incluyen comandos históricos con literales sensibles y hubo exposición en una salida de herramienta durante inspección. No se copiaron valores a documentación; no repetir lecturas crudas. Rotación/revocación/purga no ejecutadas por requerir D13. Preservar archivos locales ajenos y evitar utilizarlos como comandos autorizados.

## Sesión BFF ante401JWT — P1a.5a COMPLETADA 2026-10-09
ApiHelper marca401 solo de llamadas JWT; tokenfaltante/marcaanterior evita llamadasJWT. Middlewareweb interior aInertia cierraAuthWeb, invalida sesión yregeneraCSRF incluso si uncatch ocultóerror, y cortaantescontroller si401vino delmenú. Logoutmanual usa el mismo terminadorlocal. Devuelve302 GET/HEAD,303otrosmétodos o401JSONnoInertia;403/login401/APIkey401 no cierran sesión. No refresh/logoutremoto implementados.
AGY2 + Claude review2 APROBABLE + checkpointCodex aprobado sobre30tests172aserciones y40hashesestables. P1a.5a desbloqueaP1b.3; P1a.5 completa siguependiente. Remember sinJWT en páginas sinAPI queda5c; mejora varianteGET/logcontexto deT12 quedaR8MENORparaP1b.3. APIkey401 enDepartamento conserva sesión pero aúnpuede500, errorescompletosvanP1b.3. Sin accesosBDpersistente/QA/prod ni cambiosschema.

## Punto de continuidad durable 2026-10-09
P0 permanece 11/12 por P0.7 bloqueada tras cinco ciclos. P0.6d revalidada; P1a.1 y P1a.5a aprobadas por Claude y checkpoint independiente Codex. P1b.3 ya tiene su dependencia P1a.5a satisfecha; siguiente tarea seleccionada es P1b.1. P1b/P1c aún no implementadas en esta ejecución. Decisiones pendientes mantienen sus ramas bloqueadas; no hubo intervención de QA, producción ni BD persistentes. Reanudación detallada en SESSION_HANDOFF, sin asumir nuevas autorizaciones de producto.

## P1b.1 cerrada — 2026-10-31
STATUS: APPROVED; P1b.1[x]. AGY implementó 12 referencias Vue y 6 redirects PHP; Claude APROBABLE (.ai-local/P1B_1_CLAUDE_REVIEW.md), Codex checkpoint APROBADO (diff 18 sustituciones, 14/14 hashes reversibles, 8/8 archivos tracked dirty preservados, PHPUnit focalizado 13 tests/63 assertions PASS). No cambios de contratos/CSS/BD ni Git write; index vacío en ambos repos. ziggy.js estático no consumido residual; Login password.request inexistente para evaluación P1b.3/P2.11. No afirmar validación visual navegador ni integración BD real. Claude no pudo reejecutar PHP por permisos: revisó mismos hashes de AGY/Codex.
NEXT_ACTION: P1b.2 análisis Claude mediante .ai-local/P1B_2_CLAUDE_REQUEST.md. Usuario autoriza completar fase P1b con Claude reviewer/AGY implementador. Cuentas de prueba diferidas por usuario; no crear ahora. D4 pendiente de respuesta, P1b.5 bloqueada. P0.7 sigue bloqueada sin sexto ciclo. No staging/commit/push.
## P1b.2 cerrada — 2026-10-31
STATUS: APPROVED; P1b.2[x]. AGY implementación tras recuperación de red; Claude P1B_2_CLAUDE_REVIEW.md APROBABLE con107/107 actuales; Codex107/107 ylint8nuevos exit0, baseline30solo5controllerscambiados. 7srcnuevos+1test. Services/schema/main/PaginacionDto/BFF intactos. Globaltsc únicoTS18046histórico bootstrap-admin.spec.ts:204; controllers lint histórico reclamar,3warningsdisableinnecesario. Residualesidsenormes/paginación/order/queryBFF documentados, no bloqueantes. No BDpersistente/QA/prod/Gitwrite. Ambos a1 APIbba7f5e BFF8da6731.
NEXT_ACTION: P1b.3 análisisClaude P1B_3_CLAUDE_REQUEST.md ydespuésAGY/review/checkpoint. No asumir fasecompleta. D4pendiente; cuentasdiferidas.
## CIERRE VIGENTE — 2026-10-31 — DETENIDO POR PEDIDO DEL USUARIO
COMPLETED: P1b.1[x], P1b.2[x], P1b.3[x]. AGY implementó; Claude verificó; Codex checkpoint independiente y cierre documental. P1b.3 final91tests/1049asercionesPASS (47/813 nuevos +44/236regresión), php-l4PASS,2SFCPASS,snapshot116drift0. Evidencia P1B_3_CODEX_FINAL_CHECKPOINT.md y CLAUDE_REVIEW_CYCLE2.md. P1b.2 107/107PASS; P1b.1 13/63PASS históricos de esta sesión.
STATUS: STOPPED_AT_USER_REQUEST. Usuario: finalizar un punto más y terminamos. Se cerró P1b.3; NO iniciar P1b.4. No hay CLI Claude/AGY ni tests de esta ejecución pendientes. No cerrar procesos ajenos.
NEXT_ACTION: Si usuario reanuda, analizar P1b.4 (paginación remota/selectores con filtros) con Claude, implementar AGY, reviewClaude/checkpointCodex. P1b.5 requiere D4 todavía sin respuesta; P1b.6 pendiente. No afirmar faseP1bcompleta. Cuentas de prueba diferidas, ninguna creada; SoloLectura no carga, Contador recomendado para carga. No guardar contraseña en documentos.
BLOCKERS: P0.7 sigue FIVE_CYCLES_EXHAUSTED/HUMAN_DECISION_REQUIRED sin autorización ciclo6. D4/D5/D7/D9/D13 y otras decisiones conservan bloqueos respectivos. No crear nuevas decisiones por silencio.
LIMITS: Sin navegador/BDpersistente/QA/prod/servicios externos. Otros listados ocultan errores, timeout y flashglobal pendientes. O6 test mismoBearer ambasllamadas residualmenor. TShistórico bootstrap-admin.spec.ts:204 pendiente ajeno. No secretos leídos/copied en esta ejecución.
GIT: API yBFF rama a1 (APIbba7f5e, BFF8da6731), dirty preexistente preservado más tareasaprobadas; indexvacío, sin staging/commit/push/cambiorama. Respetar cambios ajenos.

## Modelo comercial, acceso y estado de implementación — 2026-10-31 (actualizado)
- Etapa inicial: la empresa del usuario ofrece gestión contable sin cobrar el uso del sistema; sus clientes entregan facturas/documentos y el equipo los gestiona. Se inicia en `LIBRE` total, sin topes `FREE`.
- Etapa futura: vender/alquilar acceso directo al sistema, que deberá ser pagado. Se evaluará cuota por usuarios que cargan facturas; medición, precio y periodicidad siguen pendientes (Q1/D11), sin bloquear la base multiempresa.
- `D17` reemplazada: **sin equipos**; acceso por rol en la membresía (`Administrador`/`Contador`/`Solo Lectura`) y clientes asignados por usuario dentro de su empresa.
- `D24` (fusión real vs gestión conjunta) sigue pendiente por Q2 y solo bloquea esa función de unión.
- Q3 respondida: el usuario pidió completar instalación limpia/configuración/migración/recorrido local; alcance exclusivo local, sin QA/producción.
- No implementado: no existen entidades de empresa ni migraciones multiempresa en `src/`; la suscripción actual es por `contribuyente_id`. La migración inicial M0 ya existe, pero no está validada en MariaDB; no afirmar que la instalación limpia funciona hasta ejecutar el ciclo local pendiente.
- Documentación de modelo/guía sigue G1 `[ ]`: AGY no entregó resultado y Claude no completó review documental por fallo de conexión; Codex actualizó alcance y el chequeo final pasa (7 docs UTF-8 sin BOM/LF, 9 bloques PowerShell parseados sin errores, 6 docs fuera de alcance intactos, BFF snapshot 116 sin drift). En tarea actual Claude sí completó análisis M0 read-only; AGY no entregó código. Entities e inventario difieren (6 UNIQUE y ~29 índices ausentes, precisión temporal, ON UPDATE y nombres FK); no usar migration:generate ni auto-adoptar datos existentes por huella. M0 debe crear solo en BD vacía y preservar el esquema inventariado. G2–G4 no ejecutados; M0–M4 siguen `[ ]`.
- La sección "Decisiones Adicionales (P0.6a)" queda histórica para D17/D20; prevalece TASKS.

### M0 — migración inicial estática (2026-10-31)
- Existe `src/database/migrations/1793498913511-InitialSchema.ts` con 21 tablas, DDL fijo cotejado contra `.ai-work/SCHEMA_INVENTORY.md`. No carga el baseline en runtime.
- Claude revisión inicial: APROBABLE; I1 (aclaración de procedencia y estado en MIGRATIONS_GUIDE) e I2 (modo timestamp) se corrigieron. La revisión focalizada de esas correcciones falló por ECONNREFUSED; no hay segunda aprobación.
- `up` exige MariaDB 11.8.x y `explicit_defaults_for_timestamp=ON`, y rechaza objetos de esquema preexistentes salvo TypeORM `migrations`. `down` requiere las 21 tablas y todas vacías.
- Verificaciones actuales: 21/21 DDL y orden FK, TypeScript diagnostics del archivo 0; **sin ejecución en MariaDB**, por lo que M0 sigue abierto. Docker Desktop se inició y `mariadb:11.8` se descargó, pero no se creó contenedor ni base.
- Recuperación de fallo parcial: DDL MariaDB no es transaccional; descartar y recrear únicamente la BD temporal vacía antes de reintentar.
- Las discrepancias Entity/inventario siguen diferidas por el usuario; no forman parte de este cierre M0.
- Checkpoint para mañana: `.ai-work/README_M0.md`.
