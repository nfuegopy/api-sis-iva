# Auditoría frontend — 2026-09-30

## Alcance y evidencia

Repositorio: `../sis-iva-frontend`, rama `a1`, HEAD `8da67315bb8e94c4eb126d907bb87e035b2be402`. Cambios preexistentes preservados: package-lock.json modificado y .claude/ sin seguimiento. Las rutas de evidencia siguientes son relativas al frontend.

Primero se leyeron API_AUDIT.md, API_STATE.md y TASKS.md. El contraste API utiliza exclusivamente la auditoría persistida del 2026-09-26; no se reauditó ni releyó código API, ni se verificó su despliegue actual. Revisión estática de rutas, controllers BFF, autenticación, middleware, formularios, configuración y pruebas. No se accedió a .env, logs, BD ni servicios externos.

Arquitectura: Laravel 12/PHP ^8.2 como BFF, Vue 3, Inertia, PrimeVue 4, Vite 6 y Ziggy. Navegador → Laravel/sesión local → ApiHelper → NestJS. Usuarios locales son espejo de autenticación, no datos contables. Composer declara Inertia Laravel ^2 y npm adaptador Vue ^1: compatibilidad integral pendiente, no declarada rota solo por esa diferencia.

PARCIAL significa implementación existente con brechas; ROTO indica defecto concreto; PENDIENTE significa sin flujo conectado. Ningún CRUD queda certificado de extremo a extremo.

## Cobertura y cruce con API

| Flujo | Frontend | Cruce con API persistida |
|---|---|---|
| Login | PARCIAL: sesión local/JWT; solo rol literal Administrador | Login API no rechaza inactivos al emitir tokens |
| Refresh/logout | PARCIAL: logout local, sin refresh ni revocación remota | API tiene persistencia/endpoints, con riesgos auditados |
| Reset/Google/registro/perfil | PENDIENTE en rutas/páginas activas | Reset API parcial; Google roto; helpers/tests no demuestran integración |
| Roles/grupos/menús/permisos | PARCIAL: CRUD JWT y menú dinámico | Autorización administrativa API rota; menú no es barrera de seguridad |
| Usuarios | PARCIAL: alta con persona/documentos; edición email/rol/password | Hashes API llegan a props; contraseña del alta se escribe en logs |
| Personas | PARCIAL: alta con documentos, edición solo datos personales | API anidada existe; unicidad/histórico pendientes |
| Persona-documentos | ROTO: controller sin página Vue | Service API plantilla |
| Contribuyentes | PARCIAL: persona existente o alta inline; RUC/DV separados | API sin normalización/aislamiento completos; alta inline no atómica |
| Asignaciones | PARCIAL: listado/alta/baja | Asignar contador no habilita su login; aislamiento API incompleto |
| Compras/ventas | PARCIAL: CRUD manual con importes agregados | Sin integridad unificada/índices API; cálculo UI no reemplaza validación |
| Filtros compras/ventas | ROTO en integración | DTO API rechaza campos; BFF convierte error en [] |
| Bolsa/revisión | PARCIAL: reclamar y editar estado | Sin visor de imagen; reclamo API no atómico/autorizado por revisor |
| OCR carga | PENDIENTE: sin ruta/controller/página | API existe con defectos críticos |
| RG90 descarga | PENDIENTE: sin ruta/controller/página | Exportador API roto; no basta agregar botón |
| Timbrados | PENDIENTE administración; solo campos en comprobante | Gestión/vigencia pendiente API |
| Suscripciones/trial | PARCIAL: CRUD manual | Hereda guard/vigencia defectuosos |
| Cuotas/pagos | PARCIAL: CRUD de cuota/estado/fecha | No balance ni generación automática |
| Planes/límites/estado cuenta/renovación | PENDIENTE | Pendientes también API |
| País/departamento/ciudad/tipo documento | ROTO en acciones Vue por rutas | CRUD API existe; contratos/auth específicos requieren validación posterior |
| Dashboard | PARCIAL: saludo y tarjetas estáticas | Sin métricas integradas; no se presupone endpoint estadístico |
| Auditoría de negocio | PENDIENTE | Logs técnicos no son historial |

## Hallazgos

### F01 — P1 — Secretos en logs

`app/Http/Controllers/Auth/AuthenticatedSessionController.php:47` registra respuesta completa del login antes del filtro de rol: según contrato incluye access/refresh tokens. `Admin/UsuarioController.php:48,55` registra datos validados con password en texto, incluso ante error. Confirmado en código; no se abrió el log ni se evaluó exposición histórica. Eliminar/sanitizar y evaluar históricos/revocación según exposición real.

### F02 — P1 — Hashes propagados al navegador

`Admin/UsuarioController.php:17-29` y `Negocio/AsignacionContableController.php:16-33` pasan usuarios/relaciones completos a Inertia. Combinado con hashes expuestos por API_AUDIT, el BFF no los elimina de props aunque la tabla no los muestre. Corregir serialización API y proyección BFF; confirmar payload integrado después.

### F03 — P1 — Sesión Laravel desacoplada del JWT

`AuthenticatedSessionController.php:50-96` comprueba rol solo al login, guarda access token/usuario, habilita remember y cierra solo sesión local. ApiHelper no renueva ni centraliza 401. JWT vencido puede dejar sesión local autenticada con listas vacías o errores al escribir. Remember puede restaurar usuario sin JWT de sesión. Rutas usan auth/verified sin políticas por módulo; User no implementa MustVerifyEmail. Esto no demuestra acceso exitoso a recursos JWT: API aún valida cada token. Operaciones por API key necesitan revalidación de identidad/autorización específica.

### F04 — P1 — Rutas inexistentes en cuatro catálogos

`routes/web.php` define `parametros.*`; los CreateForm/EditForm/Index de `resources/js/Pages/Parametros/{Pais,Departamento,Ciudad,TipoDocumento}` usan `admin.parametros.*`: 12 llamadas. Ziggy se genera desde rutas actuales en `resources/views/app.blade.php`, sin alias equivalente. `Parametros/{Departamento,Ciudad}Controller.php` tiene otros seis redirects incorrectos después de escribir. Si una petición directa logra persistir, puede fallar la redirección y provocar reintentos ambiguos.

### F05 — P1 — Página persona-documentos ausente

`Admin/PersonaDocumentoController.php:22` renderiza `Admin/PersonaDocumento/Index`, inexistente, desde ruta activa. La API además tiene service plantilla. El cruce automático de renders también detectó `Public/PaginaDinamica` ausente, pero PublicPageController no está conectado a rutas: deuda heredada, no navegación actual rota.

### F06 — P1 — Filtros fallidos se muestran como ausencia de datos

`Negocio/ComprobanteController.php:15-22` y ComprobanteVentaController equivalente agregan contribuyente_id/estado_ocr. API_AUDIT ya reprodujo el 400 de estos campos. BFF captura cualquier excepción y devuelve [], y la UI informa que no hay comprobantes. Reclamar redirige al filtro REQUIERE_REVISION, afectado por lo mismo. Otros index también ocultan errores con []; distinguir vacío, 401/403, validación e indisponibilidad.

### F07 — P1 — Paginación incompleta

Compras/ventas piden limit=60; usuarios/personas/contribuyentes/asignaciones/suscripciones/cuotas y selectores usan límites fijos, normalmente 100. Controllers descartan total/page y no reenvían página; DataTable pagina localmente (`Negocio/Comprobante/Index.vue:175`). Registros posteriores al primer bloque no son accesibles desde esas vistas/selectores. Es omisión UI, no pérdida demostrada en BD.

### F08 — P1 — Alta inline deja persistencia parcial

`Negocio/ContribuyenteController.php:52-94` crea persona antes de validar RUC/DV/régimen y de crear contribuyente. Fallo posterior deja persona persistida; reintentar puede repetir alta. Validar todo primero y definir operación atómica o recuperación idempotente. No se reprodujo escribiendo datos.

### F09 — P1 — Revisión e integridad fiscal incompletas

Compras/ventas calculan total/IVA con watch y usan S/N; importes iniciales de edición no se recalculan hasta cambiar bases. EditForm expone estados técnicos/VERIFICADO_HUMANO sin flujo de transición, imagen OCR ni responsable del reclamo. API tampoco garantiza transiciones/revisor según auditoría. Compra ofrece asociados en CreateForm/store pero los omite en EditForm/update; venta no los ofrece y API tampoco. No hay detalle por ítems ni emisión electrónica demostrada.

### F10 — P1 — OCR y RG90 sin flujo conectado

No hay rutas/controllers/páginas de carga OCR o descarga RG90. HandleInertiaRequests mapea OCR a `/ocr/cargar` y exportaciones a `/negocio/exportaciones`, destinos inexistentes si API devuelve esas opciones. ApiHelper::postWithFile usa API key: no reutilizarlo sin adaptar JWT requerido para OCR. Login anuncia OCR/RG90/permisos granulares que el recorrido completo aún no ofrece.

### F11 — P2 — Menú, errores y feedback inconsistentes

HandleInertiaRequests conserva menu_grupos hasta logout; CRUD permisos/roles/menús no invalida caché. Sidebar usa props y paths, no AJAX a api.menu. Flash no se comparte globalmente; Menu lo pasa explícito y algunas acciones generan toast, pero otros formularios solo cierran. EditForm compras/ventas muestra api_error, no errores locales por campo. Varios controllers propagan excepciones; Usuario/Contribuyente concatenan message sin contemplar arrays de validación Nest. ApiHelper no define política propia de timeout/recuperación.

### F12 — P2 — Instalación, pruebas y documentación desactualizadas

Falta .env.example aunque README:76 y Composer lo referencian. Config usa API_SEGURO_URL/KEY. Tests conservan scaffolding de autenticación local/registro/reset/perfil: AuthenticationTest crea usuario local sin simular Nest; ProfileTest pide `/profile` ausente. No se encontró Http::fake/preventStrayRequests en tests. No ejecutar esas suites indiscriminadamente contra configuración real. package.json no tiene scripts test/lint. No se declara resultado PHPUnit ni build completo.

CLAUDE.md tiene afirmaciones obsoletas: todas las escrituras por API key (admin/negocio actuales usan *AsUser), sidebar AJAX/nombres Ziggy (hoy props/paths), redirect admin.dashboard (hoy dashboard correcto), persona-documentos completo (falta página). Copias detalleapi no sustituyen API_AUDIT. Texto trial en UI tampoco define política comercial válida; edición admite trial sin fecha y API guard ya tiene brechas auditadas.

## Verificación y límites

- Inventario y lectura estática sin API/BD/proveedores ni cambios frontend.
- Scripts/templates de 66 Vue SFC compilados en memoria con @vue/compiler-sfc instalado: cero errores. No valida imports, bundle Vite, contratos ni navegador.
- Cruce de renders literales: dos páginas ausentes; PersonaDocumento activa, Public/PaginaDinamica no conectada.
- Confirmación estática de 12 referencias Vue y seis redirects al prefijo erróneo.
- No PHPUnit/E2E/build completo, instalaciones ni revisión de vulnerabilidades o normativa.

Tras autorizar implementación: pruebas BFF con HTTP simulado para tokens/hashes/errores, contratos específicos de catálogos/listas/DTOs, navegador, paginación >100 registros y recorrido imagen→revisión→exportación. La API conserva la fecha y límites de su auditoría anterior; no se certifica despliegue actual.
