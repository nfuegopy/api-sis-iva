# Documentación Bootstrap Administrador (P0.6d)

## Propósito
El script `bootstrap:admin` proporciona un mecanismo seguro, versionable e idempotente para crear el primer "Administrador de Plataforma" del sistema. Se garantiza que no queden credenciales fijas en el código, en los logs, ni en la documentación.

## Prerequisito
Antes de ejecutar este bootstrap, es estrictamente obligatorio ejecutar `npm run seed:catalogs`, dado que la lógica requiere encontrar el rol global `Administrador` (por nombre) para asignárselo al usuario a crear.

## Comando y Variables Requeridas

El runner carga automáticamente el archivo `.env` local si existe, pero las variables inline del shell prevalecen.
**Recomendación de seguridad:** Se recomienda NO persistir las variables `BOOTSTRAP_*` ni `SEED_*` en el `.env`. Es mejor pasarlas de manera inline en la sesión y posteriormente evitar dejarlas en el historial del shell (o limpiarlo).

```bash
SEED_DB_HOST=127.0.0.1 \
SEED_DB_PORT=3306 \
SEED_DB_USERNAME=root \
SEED_DB_PASSWORD=<db-password> \
SEED_DB_DATABASE=<db-local-temporal> \
BOOTSTRAP_ADMIN_EMAIL="<email>" \
BOOTSTRAP_ADMIN_PASSWORD="<password-min-12>" \
BOOTSTRAP_ADMIN_NOMBRE="<nombre>" \
BOOTSTRAP_ADMIN_APELLIDO="<apellido>" \
npm run bootstrap:admin
```

Para la variante en PowerShell 5.1 con `Read-Host -AsSecureString` (sin contraseñas literales en línea de comando), ver `OPERATIONS_QA_GUIDE.md` §5.

### Reglas de las Variables Requeridas y Normalización
- `BOOTSTRAP_ADMIN_EMAIL`: Se normaliza automáticamente (trim y lowercase). Se valida el formato básico de email. El login usa el email tal cual se guardó → iniciar sesión con el email en minúsculas.
- `BOOTSTRAP_ADMIN_PASSWORD`: Debe tener un mínimo estricto de 12 caracteres. **No se le aplica trim** (se respetan espacios). El script NUNCA la imprime en pantalla, ni guarda su versión en texto plano.
- `BOOTSTRAP_ADMIN_NOMBRE` / `BOOTSTRAP_ADMIN_APELLIDO`: Se les aplica trim y se valida que no queden vacíos.

### Hash Explícito
En el flujo de bootstrap se realiza un hash **explícito** `bcrypt.hash(password, 10)` antes de persistir, el cual es plenamente compatible con el `AuthService` (`bcrypt.compare`). A diferencia del alta normal, no se depende del hook `@BeforeInsert` para hashear. Esto garantiza que la contraseña se guarde correctamente incluso si el plaintext empieza intencionalmente con la secuencia `$2b$`. (Existe una deuda registrada en P1a respecto al bypass del hook de `Usuario` en otras partes de la aplicación).

## Semántica y Orden de Ejecución

1. **Configuración**: Si la configuración es inválida, finaliza con `exit 1` **antes de conectar a la base de datos**.
2. **Idempotencia (Admin Activo)**: Una vez conectado, si ya existe un usuario con `rol_id` de "Administrador" y está `activo`, el script es un **no-op** y finaliza exitosamente con `exit 0`. **El email suministrado no se evalúa**: no se consulta, no se compara, ni se loguea.
3. **Email Existente**: Solo si no hay un administrador activo, se verifica el email provisto. Si el email ya pertenece a un usuario existente, el script falla con `exit 1` sin modificar nada, impidiendo elevar privilegios de un usuario común.
4. **Transaccionalidad**: La creación simultánea de `Persona` y `Usuario` se efectúa dentro de una misma transacción, empleando `queryRunner`. Si ocurre un fallo:
   - Se realiza un rollback **solo si la transacción está activa**.
   - Los errores ocurridos previamente a la transacción o fuera de ella se reportan tal cual de forma sanitizada (sin parámetros sensibles).

*Limitación conocida*: Las validaciones de rol, admin activo e email existente ocurren fuera de la transacción. La concurrencia está protegida a nivel de base de datos por el constraint `UNIQUE` del email, lo cual provocaría que una creación concurrente aborte, realice rollback y termine con `exit 1`.

## Códigos de Salida (Exit Codes)
- **`0`**: `CREATED` o `ALREADY_ACTIVE_ADMIN`.
- **`1`**: Configuración inválida, `ROLE_NOT_FOUND`, `EMAIL_EXISTS`, `ERROR` de base de datos, error de conexión, o bloqueo QA/host en el seed.

## Logs y Privacidad
La política de loggeo garantiza la privacidad absoluta:
- Solo se imprime la categoría del error basándose en una *allowlist* estricta de códigos (`code`) o nombres (`name`) conocidos (e.g. `ER_DUP_ENTRY`, `QueryFailedError`).
- Cualquier error que no esté en la lista blanca se registra como `UNKNOWN_ERROR`.
- NUNCA se registra el campo `message`, la consulta (`query`), los parámetros (`parameters`), ni otros campos que puedan contener datos sensibles.
- NUNCA se loguea el email, password, hash ni tokens en ningún paso del proceso (incluyendo el éxito).

## Seguridad y Prohibiciones (Entornos)
- **Local-only**: Por defecto solo está permitida la ejecución local (`localhost`, `127.0.0.1`, `::1`) controlada por la allowlist de `seed-connection.ts`.
- Queda **estrictamente PROHIBIDO** ejecutar este script manualmente contra QA remoto o Producción.
- Cualquier ejecución futura en entornos QA o Producción requiere una tarea separada y explícitamente autorizada.

## Relación con Producto y Decisiones
- **D3**: Bootstrap controlado para evitar credenciales fijas y expuestas.
- **D22**: El rol `Administrador` utilizado es equivalente a "Administrador de Plataforma" hasta la implementación de la migración multiempresa.
- **D21**: El dataset multiempresa de QA es una tarea futura y no se ve impactado por ni gestionado en este bootstrap.
