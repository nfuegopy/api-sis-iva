import { DataSource, QueryRunner, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { runBootstrapAdmin, outcomeToExitCode, BootstrapLogger } from './bootstrap-admin';
import { Persona } from '../../gestion/personas/entities/persona.entity';
import { Usuario } from '../../gestion/usuarios/entities/usuario.entity';
import { Role } from '../../referenciales/parametros/roles/entities/role.entity';
import { BootstrapAdminConfig } from './bootstrap-admin.config';

describe('runBootstrapAdmin', () => {
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let manager: jest.Mocked<EntityManager>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let usuarioRepo: jest.Mocked<Repository<Usuario>>;
  let logger: jest.Mocked<BootstrapLogger>;

  const config: BootstrapAdminConfig = {
    email: 'admin@test.com',
    password: 'superSecretPassword123',
    nombre: 'Admin',
    apellido: 'Test',
  };

  beforeEach(() => {
    roleRepo = {
      findOneBy: jest.fn(),
    } as any;

    usuarioRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto as any),
    } as any;

    manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Role) return roleRepo;
        if (entity === Usuario) return usuarioRepo;
        return null;
      }),
      save: jest.fn((entityTarget, entity: any) => {
        if (entityTarget === Persona) {
          entity.id = 1;
          return Promise.resolve(entity);
        }
        if (entityTarget === Usuario) {
          entity.id = 1;
          return Promise.resolve(entity);
        }
        return Promise.resolve(entity);
      }),
    } as any;

    let transactionActive = false;

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(async () => { transactionActive = true; }),
      commitTransaction: jest.fn(async () => { transactionActive = false; }),
      rollbackTransaction: jest.fn(async () => { transactionActive = false; }),
      release: jest.fn(),
      manager: manager,
      get isTransactionActive() {
        return transactionActive;
      },
      get isReleased() {
        return false;
      }
    } as any;

    dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Rol inexistente -> ROLE_NOT_FOUND; sin startTransaction; release llamado', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce(null);

    const result = await runBootstrapAdmin(dataSource, config, logger);

    expect(result).toBe('ROLE_NOT_FOUND');
    expect(queryRunner.startTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('Admin activo -> ALREADY_ACTIVE_ADMIN; sin transacción, sin save, sin hash', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
    usuarioRepo.findOne.mockResolvedValueOnce({ id: 1, email: 'otro@test.com' } as Usuario);

    const result = await runBootstrapAdmin(dataSource, config, logger);

    expect(result).toBe('ALREADY_ACTIVE_ADMIN');
    expect(queryRunner.startTransaction).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('Admin activo ignora email -> findOne llamado una sola vez', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
    usuarioRepo.findOne.mockResolvedValueOnce({ id: 1, email: 'otro@test.com' } as Usuario);

    const result = await runBootstrapAdmin(dataSource, config, logger);

    expect(result).toBe('ALREADY_ACTIVE_ADMIN');
    expect(usuarioRepo.findOne).toHaveBeenCalledTimes(1); // solo consulta admin activo
    expect(usuarioRepo.findOne).not.toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ email: expect.anything() }) }));
  });

  it('Email existente -> EMAIL_EXISTS; sin transacción, sin save', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
    usuarioRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 2, email: 'admin@test.com' } as Usuario);

    const result = await runBootstrapAdmin(dataSource, config, logger);

    expect(result).toBe('EMAIL_EXISTS');
    expect(queryRunner.startTransaction).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('Creación -> CREATED; save Persona y Usuario; commit; release', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
    usuarioRepo.findOne.mockResolvedValue(null);

    const result = await runBootstrapAdmin(dataSource, config, logger);

    expect(result).toBe('CREATED');
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(manager.save).toHaveBeenCalledTimes(2);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();

    // Verify persona properties
    const personaCall = (manager.save as jest.Mock).mock.calls.find(c => c[0] === Persona);
    expect(personaCall[1].nombre).toBe('Admin');
    expect(personaCall[1].apellido).toBe('Test');
  });

  it('Hash ≠ plaintext y bcrypt.compare === true', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
    usuarioRepo.findOne.mockResolvedValue(null);

    const result = await runBootstrapAdmin(dataSource, config, logger);
    expect(result).toBe('CREATED');

    const usuarioCall = (manager.save as jest.Mock).mock.calls.find(c => c[0] === Usuario);
    const guardada = usuarioCall[1].password;

    expect(guardada).not.toBe(config.password);
    const isValid = await bcrypt.compare(config.password, guardada);
    expect(isValid).toBe(true);
  });

  it('Plaintext con prefijo $2b$ -> guardada ≠ plaintext y compare true', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
    usuarioRepo.findOne.mockResolvedValue(null);

    const plain = '$2b$10$superSecretPass123';
    const result = await runBootstrapAdmin(dataSource, { ...config, password: plain }, logger);
    expect(result).toBe('CREATED');

    const usuarioCall = (manager.save as jest.Mock).mock.calls.find(c => c[0] === Usuario);
    const guardada = usuarioCall[1].password;

    expect(guardada).not.toBe(plain);
    const isValid = await bcrypt.compare(plain, guardada);
    expect(isValid).toBe(true);
  });

  it('Fallo save Persona -> ERROR; rollback; commit NO; save Usuario NO', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
    usuarioRepo.findOne.mockResolvedValue(null);
    
    manager.save.mockImplementation(async (entityTarget) => {
      if (entityTarget === Persona) {
        throw new Error('Save Persona Error');
      }
      return {};
    });

    const result = await runBootstrapAdmin(dataSource, config, logger);
    expect(result).toBe('ERROR');
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();

    const saveCalls = (manager.save as jest.Mock).mock.calls;
    expect(saveCalls.some(c => c[0] === Usuario)).toBe(false);
  });

  it('Fallo save Usuario -> ERROR; rollback; commit NO', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
    usuarioRepo.findOne.mockResolvedValue(null);
    
    manager.save.mockImplementation(async (entityTarget, entity) => {
      if (entityTarget === Persona) {
        entity.id = 1;
        return entity;
      }
      if (entityTarget === Usuario) {
        throw new Error('Save Usuario Error');
      }
      return {};
    });

    const result = await runBootstrapAdmin(dataSource, config, logger);
    expect(result).toBe('ERROR');
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
  });

  it('Fallo pre-transacción -> ERROR; rollbackTransaction NO llamado; log conserva code', async () => {
    queryRunner.connect.mockRejectedValueOnce(Object.assign(new Error('Connect failed'), { code: 'ECONNREFUSED' }));

    const result = await runBootstrapAdmin(dataSource, config, logger);
    expect(result).toBe('ERROR');
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('ECONNREFUSED'));
  });

  it('Fallo del rollback -> se conserva/loguea error original; resultado ERROR', async () => {
    roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
    usuarioRepo.findOne.mockResolvedValue(null);
    
    const dbError = new Error('DB Crash');
    Object.assign(dbError, { code: 'ER_DUP_ENTRY' });
    manager.save.mockRejectedValueOnce(dbError);

    queryRunner.rollbackTransaction.mockRejectedValueOnce(new Error('Rollback failed'));

    const result = await runBootstrapAdmin(dataSource, config, logger);
    expect(result).toBe('ERROR');
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Falló el rollback'));
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('ER_DUP_ENTRY'));
  });

  describe('Sanitización de Logs', () => {
    const plain = '$2b$10$esteEsUnSecretoSuperLargoYFicticio';
    const hash = 'unHashFicticioParaTests1234567890';
    
    it.each([
      ['new Error(msg con plain+hash)', new Error(`Mensaje con ${plain} y ${hash}`), null],
      ['new TypeError(msg con plain)', new TypeError(`Mensaje con ${plain}`), null],
      ['new RangeError(msg con hash)', new RangeError(`Mensaje con ${hash}`), null],
      ['Error con code = plain', Object.assign(new Error('msg'), { code: plain }), null],
      ['Error con name = hash', Object.assign(new Error('msg'), { name: hash }), null],
      ['clase propia extends Error con name propio', Object.assign(new Error(`msg con ${plain}`), { name: 'MiPropioError' }), null],
      ['QueryFailedError ER_DUP_ENTRY', Object.assign(new Error(), { name: 'QueryFailedError', code: 'ER_DUP_ENTRY', query: `query con ${hash}`, parameters: [plain, hash], driverError: { message: `msg con ${plain}`, code: 'ER_DUP_ENTRY' } }), 'ER_DUP_ENTRY'],
      ['QueryFailedError con code = plain', Object.assign(new Error(), { name: 'QueryFailedError', code: plain }), null],
      ['objeto plano', { message: plain, code: hash, name: plain }, null],
      ['string lanzado con plain', `string lanzado con ${plain}`, null],
      ['null lanzado', null, null],
      ['undefined lanzado', undefined, null],
    ])('Fuga de secretos: %s', async (desc, errorObj, expectedCode) => {
      roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
      usuarioRepo.findOne.mockResolvedValue(null);
      manager.save.mockRejectedValueOnce(errorObj);
      
      const result = await runBootstrapAdmin(dataSource, config, logger);
      expect(result).toBe('ERROR');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      
      const logCalls = [...logger.log.mock.calls, ...logger.error.mock.calls];
      for (const callArgs of logCalls) {
        const msg = callArgs.join(' ');
        expect(msg).not.toContain(plain);
        expect(msg).not.toContain(hash);
        expect(msg).not.toContain(config.email);
        if (expectedCode) {
          expect(msg).toContain(expectedCode);
        }
      }
    });

    it('Logs sin secretos en CREATED (no email)', async () => {
      roleRepo.findOneBy.mockResolvedValueOnce({ id: 1, nombre: 'Administrador' } as Role);
      usuarioRepo.findOne.mockResolvedValue(null);

      await runBootstrapAdmin(dataSource, config, logger);

      const logCalls = [
        ...logger.log.mock.calls,
        ...logger.error.mock.calls,
      ];
      
      for (const callArgs of logCalls) {
        const msg = callArgs.join(' ');
        expect(msg).not.toContain(config.password);
        expect(msg).not.toContain(config.email);
      }
    });
  });

  it('outcomeToExitCode', () => {
    expect(outcomeToExitCode('CREATED')).toBe(0);
    expect(outcomeToExitCode('ALREADY_ACTIVE_ADMIN')).toBe(0);
    expect(outcomeToExitCode('ROLE_NOT_FOUND')).toBe(1);
    expect(outcomeToExitCode('EMAIL_EXISTS')).toBe(1);
    expect(outcomeToExitCode('ERROR')).toBe(1);
  });
});

import { sanitizeErrorCategory } from './bootstrap-admin';

describe('sanitizeErrorCategory', () => {
  it('code permitido -> code', () => {
    expect(sanitizeErrorCategory({ code: 'ER_DUP_ENTRY' })).toBe('ER_DUP_ENTRY');
  });
  
  it('code no permitido + name permitido -> name', () => {
    expect(sanitizeErrorCategory({ code: 'SECRET', name: 'QueryFailedError' })).toBe('QueryFailedError');
  });
  
  it('ambos no permitidos -> UNKNOWN_ERROR', () => {
    expect(sanitizeErrorCategory({ code: 'SECRET', name: 'SECRET' })).toBe('UNKNOWN_ERROR');
  });
  
  it('getter que lanza -> UNKNOWN_ERROR', () => {
    const errorObj = {
      get code() {
        throw new Error('fail');
      }
    };
    expect(sanitizeErrorCategory(errorObj)).toBe('UNKNOWN_ERROR');
  });

  it('getter inestable de code se lee una sola vez', () => {
    let readCount = 0;
    const errorObj = {
      get code() {
        readCount++;
        if (readCount === 1) return 'ER_DUP_ENTRY';
        return 'SECRET_CODE';
      }
    };
    expect(sanitizeErrorCategory(errorObj)).toBe('ER_DUP_ENTRY');
    expect(readCount).toBe(1);
  });

  it('getter inestable de name se lee una sola vez', () => {
    let readCount = 0;
    const errorObj = {
      get name() {
        readCount++;
        if (readCount === 1) return 'QueryFailedError';
        return 'SECRET_NAME';
      }
    };
    expect(sanitizeErrorCategory(errorObj)).toBe('QueryFailedError');
    expect(readCount).toBe(1);
  });
});
