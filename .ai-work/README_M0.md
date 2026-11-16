# Reanudación de M0 — instalación inicial MariaDB

Última actualización: 2026-11-01  
Rama de trabajo: `a1`  
Estado: **pendiente de ejecución y aceptación runtime**

## Punto en que quedó

- Migración `src/database/migrations/1793498913511-InitialSchema.ts` creada con DDL estático para las 21 tablas del inventario.
- El checker estático confirmó 21/21 tablas, coincidencia del DDL de referencia, orden de claves foráneas y guardas de instalación/reversión. TypeScript no reportó diagnósticos para la migración.
- Claude dio **APROBABLE** en la revisión inicial. La revisión posterior de las correcciones I1/I2 falló por `ECONNREFUSED`; queda pendiente. AGY agotó el tiempo de revisión.
- I1 se atendió en `.ai-work/MIGRATIONS_GUIDE.md`: el baseline histórico no se ejecuta; M0 es una migración estática independiente.
- I2 se atendió en la migración: exige MariaDB 11.8.x y `explicit_defaults_for_timestamp=ON`.
- Docker Desktop quedó iniciado y la imagen `mariadb:11.8` fue descargada. `docker info` respondió al ejecutarlo con permisos elevados. **No se creó ningún contenedor ni base de datos**, y no se corrió ninguna migración.
- No corregir todavía las diferencias entre Entities y el inventario: el usuario pidió revisarlas después.

## Continuación segura

1. Comprobar que Docker Engine responde (`docker info`) y crear un contenedor MariaDB 11.8 **desechable**, sin volumen persistente, con puerto publicado solo en `127.0.0.1` y credenciales temporales.
2. Crear una base temporal cuyo nombre no sea el de QA y definir las cinco variables `MIGRATION_DB_*` solo en la sesión local de PowerShell. No guardarlas en `.env`, documentos ni historial compartido.
3. Confirmar que el servidor es MariaDB 11.8 y que `@@SESSION.explicit_defaults_for_timestamp = 1`.
4. Ejecutar `npm run migration:run`, verificar las 21 tablas y cotejar el esquema con `.ai-work/SCHEMA_INVENTORY.md`, normalizando las diferencias propias de MariaDB JSON/defaults descritas en la revisión Claude.
5. Asegurar que la base esté vacía; ejecutar `npm run migration:revert` y después `npm run migration:run` otra vez. Confirmar el resultado final.
6. Limpiar las variables de entorno y dejar que se elimine el contenedor temporal. No usar MySQL 8, QA ni producción.

MariaDB hace commits implícitos en DDL. Si una ejecución falla a mitad, no reintentar sobre esa base parcial: descartar y recrear únicamente la base temporal.

## Después de M0

Actualizar `.ai-work/TASKS.md` solo con evidencia real. M0 continúa `[ ]` hasta completar `run → revert → run` y el cotejo en MariaDB 11.8. Después siguen M1 (modelo tenant), M2 (aislamiento API), M3 (BFF/frontend) y M4 (instalación y recorrido con dos empresas).
