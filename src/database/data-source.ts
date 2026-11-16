import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno del archivo .env
dotenv.config();

const {
  MIGRATION_DB_HOST,
  MIGRATION_DB_PORT,
  MIGRATION_DB_USERNAME,
  MIGRATION_DB_PASSWORD,
  MIGRATION_DB_DATABASE,
} = process.env;

// 1. REQUERIR VARIABLES MIGRATION_DB_*
if (!MIGRATION_DB_HOST || !MIGRATION_DB_PORT || !MIGRATION_DB_USERNAME || !MIGRATION_DB_PASSWORD || !MIGRATION_DB_DATABASE) {
  console.error('\n⛔ ERROR: Faltan variables obligatorias MIGRATION_DB_*.');
  console.error('El CLI de migraciones requiere explícitamente definir:');
  console.error('- MIGRATION_DB_HOST\n- MIGRATION_DB_PORT\n- MIGRATION_DB_USERNAME\n- MIGRATION_DB_PASSWORD\n- MIGRATION_DB_DATABASE');
  console.error('\nNo se permite el uso de variables DB_* por seguridad.');
  process.exit(1);
}

// 2. ALLOWLIST LOCAL Y BLOQUEOS EXPLÍCITOS
const allowedHosts = ['localhost', '127.0.0.1', '::1'];
const blockedHosts = ['srv2082.hstgr.io', '.hstgr.io'];
const blockedDBs = ['u548533417_qa_bd_iva'];

const hostLower = MIGRATION_DB_HOST.toLowerCase();
const dbLower = MIGRATION_DB_DATABASE.toLowerCase();

// A. Bloqueo explícito de DB
if (blockedDBs.some(db => dbLower === db.toLowerCase())) {
  console.error('\n⛔ ERROR CRÍTICO: Intento de conexión a la base de datos de QA.');
  console.error('Base de datos bloqueada explícitamente.');
  process.exit(1);
}

// B. Bloqueo explícito de Host
if (blockedHosts.some(host => hostLower === host.toLowerCase() || hostLower.endsWith(host.toLowerCase()))) {
  console.error('\n⛔ ERROR CRÍTICO: Intento de conexión a un host remoto/QA.');
  console.error('Host bloqueado explícitamente.');
  process.exit(1);
}

// C. Allowlist Local
if (!allowedHosts.includes(hostLower)) {
  console.error(`\n⛔ ERROR DE SEGURIDAD: Host no permitido (${MIGRATION_DB_HOST}).`);
  console.error('Las migraciones solo pueden ejecutarse contra hosts locales (localhost, 127.0.0.1, ::1).');
  process.exit(1);
}

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: MIGRATION_DB_HOST,
  port: parseInt(MIGRATION_DB_PORT, 10),
  username: MIGRATION_DB_USERNAME,
  password: MIGRATION_DB_PASSWORD,
  database: MIGRATION_DB_DATABASE,
  synchronize: false,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  migrationsRun: false,
  charset: 'utf8mb4',
});
