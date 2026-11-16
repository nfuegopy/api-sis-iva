import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

export function getSeedDataSource(): DataSource {
  const {
    SEED_DB_HOST,
    SEED_DB_PORT,
    SEED_DB_USERNAME,
    SEED_DB_PASSWORD,
    SEED_DB_DATABASE,
  } = process.env;

  // 1. REQUERIR VARIABLES SEED_DB_*
  if (!SEED_DB_HOST || !SEED_DB_PORT || !SEED_DB_USERNAME || !SEED_DB_PASSWORD || !SEED_DB_DATABASE) {
    console.error('\n🚫 ERROR: Faltan variables obligatorias SEED_DB_*.');
    console.error('El script de seed requiere explícitamente definir:');
    console.error('- SEED_DB_HOST\n- SEED_DB_PORT\n- SEED_DB_USERNAME\n- SEED_DB_PASSWORD\n- SEED_DB_DATABASE');
    console.error('\nNo se permite el uso de variables DB_* por seguridad.');
    process.exit(1);
  }

  // 2. ALLOWLIST LOCAL Y BLOQUEOS EXPLÍCITOS
  const allowedHosts = ['localhost', '127.0.0.1', '::1'];
  const blockedHosts = ['srv2082.hstgr.io', '.hstgr.io'];
  const blockedDBs = ['u548533417_qa_bd_iva'];

  const hostLower = SEED_DB_HOST.toLowerCase();
  const dbLower = SEED_DB_DATABASE.toLowerCase();

  if (blockedDBs.some(db => dbLower === db.toLowerCase())) {
    console.error('\n🚫 ERROR CRÍTICO: Intento de conexión a la base de datos de QA.');
    console.error('Base de datos bloqueada explícitamente.');
    process.exit(1);
  }

  if (blockedHosts.some(host => hostLower === host.toLowerCase() || hostLower.endsWith(host.toLowerCase()))) {
    console.error('\n🚫 ERROR CRÍTICO: Intento de conexión a un host remoto/QA.');
    console.error('Host bloqueado explícitamente.');
    process.exit(1);
  }

  if (!allowedHosts.includes(hostLower)) {
    console.error(`\n🚫 ERROR DE SEGURIDAD: Host no permitido (${SEED_DB_HOST}).`);
    console.error('Los seeds solo pueden ejecutarse contra hosts locales (localhost, 127.0.0.1, ::1).');
    process.exit(1);
  }

  return new DataSource({
    type: 'mariadb',
    host: SEED_DB_HOST,
    port: parseInt(SEED_DB_PORT, 10),
    username: SEED_DB_USERNAME,
    password: SEED_DB_PASSWORD,
    database: SEED_DB_DATABASE,
    synchronize: false,
    entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
    charset: 'utf8mb4',
  });
}
