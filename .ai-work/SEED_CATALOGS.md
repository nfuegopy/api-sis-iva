# Documentación Seed Catálogos (P0.6c)

## Objetivo
El script `seed:catalogs` proporciona un mecanismo versionable, reproducible e idempotente para sembrar los catálogos base del sistema:
- `roles`
- `grupo_menu`
- `menu`
- `menu_rol`

## Códigos de Salida (Exit Codes)
El seed es seguro para utilizarse en automatización.
- **Seed exitoso**: Retorna `exit code 0`.
- **Seed fallido**: Retorna `exit code 1` (u otro valor distinto de 0) cuando falta configuración, es bloqueado por seguridad o falla la conexión/inserción.

## Limitaciones y Exclusiones
- **NO INCLUYE (Dataset QA D21):** No se siembran usuarios de QA, contraseñas, correos electrónicos (ej. administradores iniciales), empresas, equipos, contribuyentes, comprobantes ni credenciales reales. El dataset completo de QA corresponde a la decisión D21 en una etapa futura (P0.6d y posterior).
- **Transacción:** El script actualmente no envuelve las escrituras en una única transacción de base de datos. Se registra como deuda técnica no bloqueante para el futuro.
- **Prohibición de QA:** El script posee medidas explícitas para abortar si la conexión apunta a Hostinger/QA, evitando sobreescrituras accidentales.

## Estrategia de Idempotencia, Claves Naturales y Campos Controlados
Para permitir ejecuciones múltiples sin duplicación de datos y sin recurrir a comandos masivos y destructivos como `TRUNCATE`, el seed utiliza inserciones y actualizaciones (upserts) controladas:

1. **Roles:**
   - **Clave:** `nombre`
   - **Campos controlados:** Se actualiza `descripcion`.
2. **Grupos de Menú:**
   - **Clave:** `nombre`
   - **Campos controlados:** Se actualizan `descripcion` e `icono` **únicamente** si se les pasa un valor. En este caso el script pasa `undefined`, por ende TypeORM *no* fuerza la sobreescritura (ni blanquea a `NULL`) los valores existentes en la base de datos si ya tenían valor previo ajeno al seed.
3. **Menú:**
   - **Clave:** `url`
   - **Campos controlados:** Se actualizan `nombre`, `icono` y la clave foránea `grupo_menu_id`. `descripcion` no se fuerza si está `undefined`.
4. **Menu Rol (Permisos):**
   - **Clave:** ID de Rol + ID de Menú (resueltos previamente)
   - **Campos controlados:** Se actualizan los permisos explícitos de `permitir_listar`, `permitir_guardar`, `permitir_editar` y `permitir_eliminar` para los 37 registros vitales del sistema.
   - **Permisos Extra:** El seed garantiza estos 37 registros, pero **NO ELIMINA** relaciones adicionales que pudieran existir en la base de datos. Se conservan intencionalmente para evitar un DELETE destructivo.

## Comando y Ejecución

Para ejecutar el seed se requiere proveer explícitamente las variables de conexión del entorno:

```bash
SEED_DB_HOST=127.0.0.1 \
SEED_DB_PORT=3306 \
SEED_DB_USERNAME=root \
SEED_DB_PASSWORD=<db-password> \
SEED_DB_DATABASE=bd_sis_iva_seed_test \
npm run seed:catalogs
```

En PowerShell usar Read-Host -AsSecureString (ver OPERATIONS_QA_GUIDE.md §5); no escribir contraseñas literales en la línea de comando.

*Nota:* Dependiendo de la terminal (PowerShell, CMD, Bash), la inyección de variables se realiza de diferente manera, pero el script de npm abortará si no se proveen todas. El Host DEBE pertenecer a una allowlist de direcciones locales (`localhost`, `127.0.0.1`, `::1`).
