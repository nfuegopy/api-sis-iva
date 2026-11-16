# Guía de Migrations TypeORM (P0.6b)

## Relación con D23 (Motor Objetivo)
El motor objetivo para la aplicación y las migraciones es **MariaDB 11.8.x** (paridad con QA/Producción). El `AppModule` y el `data-source.ts` de TypeORM están configurados con `type: 'mariadb'`, utilizando el driver subyacente `mysql2`.

## Baseline Histórico (MySQL 8)
El archivo `database/baseline/0000-current-schema-mysql8.sql` es un snapshot histórico de la base de datos local en MySQL 8. No se ejecuta como archivo ni se usa como fuente de migraciones automáticas. Se mantiene sin renombrar como referencia del esquema original.

La migración inicial `src/database/migrations/1793498913511-InitialSchema.ts` es una **transcripción estática versionada**, creada una sola vez y cotejada tabla por tabla contra `.ai-work/SCHEMA_INVENTORY.md`. No lee el baseline durante la ejecución, no se genera con `migration:generate` y solo instala las 21 tablas en una base local vacía. `migration:run` aborta ante cualquier objeto de esquema existente (salvo la tabla TypeORM `migrations`). No ejecutar esta migración en QA/Producción ni sobre bases con datos; importar o adoptar datos existentes requiere un procedimiento separado.

## Variables de Entorno y Seguridad

El CLI de TypeORM está configurado para requerir **explícita y obligatoriamente** las siguientes variables de entorno para evitar conexiones accidentales usando la configuración de la aplicación (`DB_*`):

- `MIGRATION_DB_HOST`
- `MIGRATION_DB_PORT`
- `MIGRATION_DB_USERNAME`
- `MIGRATION_DB_PASSWORD`
- `MIGRATION_DB_DATABASE`

⛔ Si falta alguna de estas variables, el CLI **abortará** inmediatamente. **No se hace fallback a `DB_*`**.

### ⛔ Advertencia Crítica sobre QA/Producción

El `data-source.ts` cuenta con una allowlist local y un bloqueo estricto. **Solo se permite la ejecución de migraciones si `MIGRATION_DB_HOST` es local** (`localhost`, `127.0.0.1` o `::1`). 
Cualquier intento de apuntar a QA (`srv2082.hstgr.io`, la base `u548533417_qa_bd_iva` o cualquier otro host remoto) abortará la ejecución con un error crítico.

Si en el futuro se requiere ejecutar migraciones en QA, será a través de un procedimiento autorizado y aislado distinto a los scripts locales.

## Cómo usar el CLI de Migrations

El proyecto utiliza scripts en `package.json` para facilitar el uso del CLI de TypeORM. Asegúrate de tener definidas las variables `MIGRATION_DB_*` localmente.

- `npm run migration:show` — Muestra el estado de las migraciones (cuáles se han corrido y cuáles faltan).
- `npm run migration:run` — Ejecuta las migraciones pendientes.
- `npm run migration:revert` — Revierte la última migración ejecutada.
- `npm run migration:generate -- src/database/migrations/NombreMigracion` — Genera una migración a partir de los cambios detectados en las entidades.
- `npm run migration:create -- src/database/migrations/NombreMigracion` — Crea un archivo vacío para escribir una migración manual.

> Estado 2026-10-31: M0 incorpora una migración inicial versionada para MariaDB 11.8.x. Requiere base local vacía, `explicit_defaults_for_timestamp=ON` y verifica motor/versión antes de operar. MariaDB ejecuta DDL con commits implícitos; si falla una ejecución parcial, descartar y recrear únicamente la base temporal. `migration:show/run` crean la tabla `migrations`. `migration:revert` y `migration:generate` no forman parte de la guía operativa; ver `OPERATIONS_QA_GUIDE.md`. La aceptación runtime en MariaDB 11.8 sigue pendiente.

### Entorno Seguro Recomendado

- **Generación de Migraciones:** Las migraciones automáticas (`migration:generate`) deben generarse siempre contra un **entorno local temporal vacío** o contra tu base de datos de desarrollo local, nunca contra QA, para evitar que diferencias sutiles borren índices o reglas.
- Es recomendable levantar MariaDB 11.8.x localmente para evitar discrepancias de dialecto con el motor objetivo.
