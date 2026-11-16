import { DataSource, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Persona } from '../../gestion/personas/entities/persona.entity';
import { Usuario } from '../../gestion/usuarios/entities/usuario.entity';
import { Role } from '../../referenciales/parametros/roles/entities/role.entity';
import { BootstrapAdminConfig } from './bootstrap-admin.config';

export type BootstrapOutcome =
  | 'CREATED'
  | 'ALREADY_ACTIVE_ADMIN'
  | 'ROLE_NOT_FOUND'
  | 'EMAIL_EXISTS'
  | 'ERROR';

export interface BootstrapLogger {
  log(msg: string): void;
  error(msg: string): void;
}

export function outcomeToExitCode(o: BootstrapOutcome): 0 | 1 {
  return o === 'CREATED' || o === 'ALREADY_ACTIVE_ADMIN' ? 0 : 1;
}

export const SAFE_ERROR_CODES: ReadonlySet<string> = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH',
  'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR',
  'ER_DUP_ENTRY', 'ER_DATA_TOO_LONG', 'ER_NO_REFERENCED_ROW_2', 'ER_NO_SUCH_TABLE',
  'ER_BAD_FIELD_ERROR', 'ER_LOCK_WAIT_TIMEOUT', 'ER_LOCK_DEADLOCK',
]);
export const SAFE_ERROR_NAMES: ReadonlySet<string> = new Set([
  'QueryFailedError', 'TypeORMError', 'Error', 'TypeError', 'RangeError',
]);
export function sanitizeErrorCategory(error: unknown): string {
  if (error === null || typeof error !== 'object') {
    return 'UNKNOWN_ERROR';
  }
  try {
    const e = error as any;
    const code = e.code;
    if (typeof code === 'string' && SAFE_ERROR_CODES.has(code)) {
      return code;
    }
    const name = e.name;
    if (typeof name === 'string' && SAFE_ERROR_NAMES.has(name)) {
      return name;
    }
    return 'UNKNOWN_ERROR';
  } catch {
    return 'UNKNOWN_ERROR';
  }
}

export async function runBootstrapAdmin(
  dataSource: DataSource,
  config: BootstrapAdminConfig,
  logger: BootstrapLogger = console,
): Promise<BootstrapOutcome> {
  const queryRunner = dataSource.createQueryRunner();
  let outcome: BootstrapOutcome = 'ERROR';
  
  try {
    await queryRunner.connect();
    
    // Buscar rol Administrador
    const rolRepo = queryRunner.manager.getRepository(Role);
    const rolAdmin = await rolRepo.findOneBy({ nombre: 'Administrador' });
    
    if (!rolAdmin) {
      logger.error('ROLE_NOT_FOUND: No se encontró el rol "Administrador". Ejecute primero seed:catalogs.');
      outcome = 'ROLE_NOT_FOUND';
      return outcome;
    }
    
    // Buscar usuario { rol_id, activo: true }
    const usuarioRepo = queryRunner.manager.getRepository(Usuario);
    const activeAdmin = await usuarioRepo.findOne({
      where: { rol_id: rolAdmin.id, activo: true }
    });
    
    if (activeAdmin) {
      logger.log('ALREADY_ACTIVE_ADMIN: Un Administrador de Plataforma ya existe y está activo. No se requiere bootstrap.');
      outcome = 'ALREADY_ACTIVE_ADMIN';
      return outcome;
    }
    
    // Buscar usuario por config.email
    const emailExistente = await usuarioRepo.findOne({ where: { email: config.email } });
    if (emailExistente) {
      logger.error('EMAIL_EXISTS: El email normalizado ya pertenece a un usuario existente.');
      outcome = 'EMAIL_EXISTS';
      return outcome;
    }
    
    // Hash explícito, fuera de la transacción
    const passwordHash = await bcrypt.hash(config.password, 10);
    
    await queryRunner.startTransaction();
    
    // Crear y guardar Persona (nombre y apellido ya normalizados por la config)
    const nuevaPersona = new Persona();
    nuevaPersona.nombre = config.nombre;
    nuevaPersona.apellido = config.apellido;
    const personaGuardada = await queryRunner.manager.save(Persona, nuevaPersona);
    
    // Crear y guardar Usuario con passwordHash
    const nuevoUsuarioEnt = usuarioRepo.create({
      email: config.email,
      password: passwordHash,
      rol_id: rolAdmin.id,
      persona_id: personaGuardada.id,
      activo: true,
      es_temporal: false
    });
    
    const usuarioGuardado = await queryRunner.manager.save(Usuario, nuevoUsuarioEnt);
    
    await queryRunner.commitTransaction();
    logger.log(`CREATED: Bootstrap completado exitosamente. Usuario Administrador de Plataforma creado (ID: ${usuarioGuardado.id}).`);
    outcome = 'CREATED';
    return outcome;
  } catch (error: any) {
    if (queryRunner.isTransactionActive) {
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        logger.error('Aviso: Falló el rollback de la transacción.');
      }
    }
    // Log sanitizado
    logger.error(`ERROR durante el bootstrap: ${sanitizeErrorCategory(error)}`);
    outcome = 'ERROR';
    return outcome;
  } finally {
    if (queryRunner && !queryRunner.isReleased) {
      try {
        await queryRunner.release();
      } catch (e) {
        // Ignorar errores de release para no enmascarar outcome
      }
    }
  }
}
