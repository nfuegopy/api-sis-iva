# Compatibilidad de Motores: MySQL 8 vs MariaDB 11

**Local:** MySQL 8.0.44 (`bd_sis_iva`)
**Remoto QA:** MariaDB 11.8.9 (`u548533417_qa_bd_iva`)

## 1. Conteo de Tablas
- Local: 21
- Remoto QA: 21

## 2. Diferencias Lógicas Reales
- **Ninguna.** Ambas bases de datos tienen la misma cantidad de tablas, las mismas columnas y la misma nulabilidad.

## 3. Diferencias Solo de Dialecto / Representación
Se detectaron asimetrías puramente visuales debido a cómo los motores de MySQL 8 y MariaDB 11 reportan sus metadata internamente:
- Representación `COLUMN_TYPE`: MySQL 8 omite el display width en enteros (ej. `int`), mientras que MariaDB 11 lo conserva (ej. `int(11)`). Afectó a 50 columnas.
- Representación `COLUMN_DEFAULT`: MySQL usa `CURRENT_TIMESTAMP`, MariaDB 11 usa `current_timestamp()`. Afectó a 15 columnas.

## 4. Riesgos para TypeORM Migrations
- Si generamos las migraciones con TypeORM dialect `type: 'mysql'` conectado a un MySQL 8, TypeORM ignorará las extensiones/comportamientos específicos de MariaDB y la sintaxis DDL podría ser incompatible en operaciones complejas.
- Cuando una migración genere comandos basándose en metadata `int` (MySQL), TypeORM podría emitir `ALTER TABLE` innecesarios al detectar diferencias con el entorno QA que dice `int(11)`.
- **Recomendación**: Forzar a TypeORM a usar `type: 'mariadb'`.

## 5. Entorno Local Futuro Propuesto
Para garantizar paridad 1:1 absoluta y que las migraciones se prueben sobre el mismo motor de producción, se propone (NO implementado aún):
- Levantar un contenedor Docker con MariaDB 11.8.x localmente.
- Crear base de datos: \d_sis_iva_dev_mariadb\.
