import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  RequestMethod,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import {
  GUARDS_METADATA,
  PATH_METADATA,
  METHOD_METADATA,
} from '@nestjs/common/constants';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { AdministradorGuard } from '../src/common/guards/administrador.guard';
import { MenuRolGuard } from '../src/common/guards/menu-rol.guard';
import { RolesController } from '../src/referenciales/parametros/roles/roles.controller';
import { MenuController } from '../src/referenciales/parametros/menu/menu.controller';
import { GrupoMenuController } from '../src/referenciales/parametros/grupo-menu/grupo-menu.controller';
import { MenuRolController } from '../src/referenciales/parametros/menu-rol/menu-rol.controller';
import { UsuariosController } from '../src/gestion/usuarios/usuarios.controller';
import { AuthController } from '../src/auth/auth.controller';
import { RolesService } from '../src/referenciales/parametros/roles/roles.service';
import { MenuService } from '../src/referenciales/parametros/menu/menu.service';
import { GrupoMenuService } from '../src/referenciales/parametros/grupo-menu/grupo-menu.service';
import { MenuRolService } from '../src/referenciales/parametros/menu-rol/menu-rol.service';
import { AuthService } from '../src/auth/auth.service';
import { UsuariosService } from '../src/gestion/usuarios/usuarios.service';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

const TEST_SECRET = 'TEST_SECRET_KEY_123';

describe('P1a.1 - Admin Config (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const mockUsuariosService = {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockMenuRolService = {
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const mockRolesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findMenuByRol: jest.fn(),
  };
  const mockMenuService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const mockGrupoMenuService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const genericServiceFake = { ok: true };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({ secret: TEST_SECRET })],
      controllers: [
        RolesController,
        MenuController,
        GrupoMenuController,
        MenuRolController,
        UsuariosController,
        AuthController,
      ],
      providers: [
        JwtStrategy,
        JwtAuthGuard,
        AdministradorGuard,
        MenuRolGuard,
        Reflector,
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: MenuService,
          useValue: mockMenuService,
        },
        {
          provide: GrupoMenuService,
          useValue: mockGrupoMenuService,
        },
        {
          provide: MenuRolService,
          useValue: mockMenuRolService,
        },
        {
          provide: AuthService,
          useValue: { ...genericServiceFake },
        },
        {
          provide: UsuariosService,
          useValue: mockUsuariosService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'JWT_SECRET') return TEST_SECRET;
              throw new Error('Unexpected config key: ' + key);
            },
            get: () => undefined,
          },
        },
        {
          provide: DataSource,
          useValue: {
            getRepository: () => ({
              findOne: ({
                where,
              }: {
                where: { menu?: { url?: string }; rol_id?: number };
              }) => {
                if (
                  where.menu?.url === '/usuarios' &&
                  (where.rol_id === 1 || where.rol_id === 6)
                ) {
                  return Promise.resolve({
                    permitir_listar: true,
                    permitir_guardar: true,
                    permitir_editar: true,
                    permitir_eliminar: true,
                  });
                }
                return Promise.resolve(null);
              },
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    mockUsuariosService.findOne.mockImplementation((id: number) => {
      const db: Record<number, object> = {
        1: {
          id: 1,
          email: 'admin',
          activo: true,
          rol: { id: 1, nombre: 'Administrador' },
        },
        2: {
          id: 2,
          email: 'conta',
          activo: true,
          rol: { id: 2, nombre: 'Contador' },
        },
        3: {
          id: 3,
          email: 'lector',
          activo: true,
          rol: { id: 3, nombre: 'Solo Lectura' },
        },
        4: { id: 4, email: 'norol', activo: true, rol: null },
        5: {
          id: 5,
          email: 'desc',
          activo: true,
          rol: { id: 99, nombre: 'Desconocido' },
        },
        6: {
          id: 6,
          email: 'conta2',
          activo: true,
          rol: { id: 6, nombre: 'Contador' },
        },
      };
      return Promise.resolve(db[id]);
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getToken = (id: number) => jwtService.sign({ sub: id, email: 'test' });

  const expectNingunServicioInvocado = () => {
    const mocks = [
      mockRolesService,
      mockMenuService,
      mockGrupoMenuService,
      mockMenuRolService,
    ];
    mocks.forEach((mock) => {
      Object.values(mock).forEach((fn) => {
        expect(fn).not.toHaveBeenCalled();
      });
    });
  };

  type Verbo = 'get' | 'post' | 'patch' | 'delete';
  interface RutaCaso {
    method: Verbo;
    path: string;
    body?: object;
    svc: Record<string, jest.Mock>;
    fn: string;
  }
  const ROUTES: RutaCaso[] = [
    { method: 'get', path: '/roles', svc: mockRolesService, fn: 'findAll' },
    { method: 'get', path: '/roles/1', svc: mockRolesService, fn: 'findOne' },
    {
      method: 'post',
      path: '/roles',
      body: { nombre: 'Test', descripcion: 'D' },
      svc: mockRolesService,
      fn: 'create',
    },
    {
      method: 'patch',
      path: '/roles/1',
      body: { nombre: 'Test2' },
      svc: mockRolesService,
      fn: 'update',
    },
    { method: 'delete', path: '/roles/1', svc: mockRolesService, fn: 'remove' },
    {
      method: 'get',
      path: '/roles/1/menus',
      svc: mockRolesService,
      fn: 'findMenuByRol',
    },

    { method: 'get', path: '/menu', svc: mockMenuService, fn: 'findAll' },
    { method: 'get', path: '/menu/1', svc: mockMenuService, fn: 'findOne' },
    {
      method: 'post',
      path: '/menu',
      body: { nombre: 'M', url: '/m', grupo_menu_id: 1 },
      svc: mockMenuService,
      fn: 'create',
    },
    {
      method: 'patch',
      path: '/menu/1',
      body: { nombre: 'M2' },
      svc: mockMenuService,
      fn: 'update',
    },
    { method: 'delete', path: '/menu/1', svc: mockMenuService, fn: 'remove' },

    {
      method: 'get',
      path: '/grupo-menu',
      svc: mockGrupoMenuService,
      fn: 'findAll',
    },
    {
      method: 'get',
      path: '/grupo-menu/1',
      svc: mockGrupoMenuService,
      fn: 'findOne',
    },
    {
      method: 'post',
      path: '/grupo-menu',
      body: { nombre: 'G', icono: 'ico' },
      svc: mockGrupoMenuService,
      fn: 'create',
    },
    {
      method: 'patch',
      path: '/grupo-menu/1',
      body: { nombre: 'G2' },
      svc: mockGrupoMenuService,
      fn: 'update',
    },
    {
      method: 'delete',
      path: '/grupo-menu/1',
      svc: mockGrupoMenuService,
      fn: 'remove',
    },

    {
      method: 'get',
      path: '/menu-rol',
      svc: mockMenuRolService,
      fn: 'findAll',
    },
    {
      method: 'get',
      path: '/menu-rol/1',
      svc: mockMenuRolService,
      fn: 'findOne',
    },
    {
      method: 'post',
      path: '/menu-rol',
      body: {
        menu_id: 1,
        rol_id: 1,
        permitir_listar: true,
        permitir_guardar: true,
        permitir_editar: true,
        permitir_eliminar: true,
      },
      svc: mockMenuRolService,
      fn: 'create',
    },
    {
      method: 'patch',
      path: '/menu-rol/1',
      body: { permitir_listar: false },
      svc: mockMenuRolService,
      fn: 'update',
    },
    {
      method: 'delete',
      path: '/menu-rol/1',
      svc: mockMenuRolService,
      fn: 'remove',
    },
  ];

  it('Metadata: coincidencia estricta de handlers con ROUTES', () => {
    const controllers = [
      RolesController,
      MenuController,
      GrupoMenuController,
      MenuRolController,
    ];
    const extractedRoutes: string[] = [];

    for (const ctrl of controllers) {
      expect(Reflect.getMetadata(GUARDS_METADATA, ctrl)).toEqual([
        JwtAuthGuard,
        AdministradorGuard,
      ]);
      const prefix = Reflect.getMetadata(PATH_METADATA, ctrl) as string;
      const prototype = ctrl.prototype as unknown as Record<string, object>;
      const methods = Object.getOwnPropertyNames(prototype).filter(
        (m) => m !== 'constructor',
      );

      for (const method of methods) {
        const handler = prototype[method];
        expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toBeUndefined();
        const pathObj = Reflect.getMetadata(PATH_METADATA, handler) as string;
        const reqMethod = Reflect.getMetadata(METHOD_METADATA, handler) as
          | RequestMethod
          | undefined;

        if (reqMethod !== undefined) {
          const verb = RequestMethod[reqMethod as number].toLowerCase();

          let fullPath =
            '/' +
            prefix +
            (pathObj && pathObj !== '/'
              ? pathObj.startsWith('/')
                ? pathObj
                : '/' + pathObj
              : '');
          fullPath = fullPath.replace(/:[a-zA-Z]+/g, '1');

          extractedRoutes.push(verb + ' ' + fullPath);
        }
      }
    }

    const expectedRoutes = ROUTES.map((r) => r.method + ' ' + r.path);

    expect(new Set(expectedRoutes).size).toBe(21);
    expect([...extractedRoutes].sort()).toEqual([...expectedRoutes].sort());
  });

  it('Caso 1: Anónimo -> 401 en las 21 rutas', async () => {
    for (const route of ROUTES) {
      let req = request(app.getHttpServer())[route.method](route.path);
      if (route.body) req = req.send(route.body);
      await req.expect(401);
    }
    expectNingunServicioInvocado();
  });

  it('Caso 2: Token inválido -> 401', async () => {
    for (const route of ROUTES) {
      let req = request(app.getHttpServer())
        [route.method](route.path)
        .set('Authorization', 'Bearer invalid');
      if (route.body) req = req.send(route.body);
      await req.expect(401);
    }
    expectNingunServicioInvocado();
  });

  it('Caso 3: Contador(2) y Solo Lectura(3) -> 403', async () => {
    for (const id of [2, 3]) {
      const token = getToken(id);
      for (const route of ROUTES) {
        let req = request(app.getHttpServer())
          [route.method](route.path)
          .set('Authorization', 'Bearer ' + token);
        if (route.body) req = req.send(route.body);
        await req.expect(403);
      }
    }
    expectNingunServicioInvocado();
  });

  it('Caso 4: Rol null(4) y desconocido(5) -> 403', async () => {
    for (const id of [4, 5]) {
      const token = getToken(id);
      for (const route of ROUTES) {
        let req = request(app.getHttpServer())
          [route.method](route.path)
          .set('Authorization', 'Bearer ' + token);
        if (route.body) req = req.send(route.body);
        await req.expect(403);
      }
    }
    expectNingunServicioInvocado();
  });

  it('Caso 5: Administrador(1) -> 2xx', async () => {
    const token = getToken(1);
    for (const route of ROUTES) {
      jest.clearAllMocks();
      let req = request(app.getHttpServer())
        [route.method](route.path)
        .set('Authorization', 'Bearer ' + token);
      if (route.body) req = req.send(route.body);
      const res = await req;
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
      expect(route.svc[route.fn]).toHaveBeenCalledTimes(1);
    }
  });

  it('Caso extra: Token falsificado con rol Administrador en payload -> 403 y token válido -> 2xx', async () => {
    const tokenFake = jwtService.sign({
      sub: 2,
      email: 'conta',
      rol: { id: 1, nombre: 'Administrador' },
    });

    jest.clearAllMocks();
    for (const route of ROUTES) {
      let req = request(app.getHttpServer())
        [route.method](route.path)
        .set('Authorization', 'Bearer ' + tokenFake);
      if (route.body) req = req.send(route.body);
      await req.expect(403);
    }
    expectNingunServicioInvocado();

    const tokenContaEnBD = jwtService.sign({
      sub: 1,
      email: 'admin',
      rol: { nombre: 'Contador' },
    });
    await request(app.getHttpServer())
      .get('/roles')
      .set('Authorization', 'Bearer ' + tokenContaEnBD)
      .expect(200);
  });

  it('Caso 6: Autoasignación vía menu-rol: 403 para Contador', async () => {
    const token = getToken(2);
    await request(app.getHttpServer())
      .post('/menu-rol')
      .set('Authorization', 'Bearer ' + token)
      .send({
        menu_id: 1,
        rol_id: 2,
        permitir_listar: true,
        permitir_guardar: true,
        permitir_editar: true,
        permitir_eliminar: true,
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch('/menu-rol/1')
      .set('Authorization', 'Bearer ' + token)
      .send({ permitir_listar: true })
      .expect(403);

    expect(mockMenuRolService.create).not.toHaveBeenCalled();
    expect(mockMenuRolService.update).not.toHaveBeenCalled();
  });

  it('Caso 7: Autoasignación vía usuarios (rol_id no permitido para no admin)', async () => {
    const token = getToken(6);

    const resCreate = await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'x@x.com',
        password: 'password123',
        persona_id: 1,
        rol_id: 1,
      })
      .expect(403);
    expect((resCreate.body as Record<string, string>).message).toBe(
      'Solo un Administrador puede asignar roles.',
    );

    const resUpdate = await request(app.getHttpServer())
      .patch('/usuarios/6')
      .set('Authorization', 'Bearer ' + token)
      .send({ rol_id: 1 })
      .expect(403);
    expect((resUpdate.body as Record<string, string>).message).toBe(
      'Solo un Administrador puede asignar roles.',
    );

    const resRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'x2@x.com',
        password: 'password123',
        persona_id: 1,
        rol_id: 1,
      })
      .expect(403);
    expect((resRegister.body as Record<string, string>).message).toBe(
      'Solo un Administrador puede asignar roles.',
    );

    const resUpdateNull = await request(app.getHttpServer())
      .patch('/usuarios/6')
      .set('Authorization', 'Bearer ' + token)
      .send({ rol_id: null })
      .expect(403);
    expect((resUpdateNull.body as Record<string, string>).message).toBe(
      'Solo un Administrador puede asignar roles.',
    );

    expect(mockUsuariosService.create).not.toHaveBeenCalled();
    expect(mockUsuariosService.update).not.toHaveBeenCalled();

    mockUsuariosService.update.mockResolvedValueOnce({ ok: true });
    await request(app.getHttpServer())
      .patch('/usuarios/6')
      .set('Authorization', 'Bearer ' + token)
      .send({ email: 'nuevo@x.com' })
      .expect(200);
  });

  it('Caso 8: Admin sí puede asignar rol_id en usuarios y register', async () => {
    const token = getToken(1);
    mockUsuariosService.update.mockResolvedValueOnce({ ok: true });
    await request(app.getHttpServer())
      .patch('/usuarios/6')
      .set('Authorization', 'Bearer ' + token)
      .send({ rol_id: 2 })
      .expect(200);

    mockUsuariosService.create.mockResolvedValueOnce({
      id: 9,
      email: 'x3@x.com',
      rol: { id: 2, nombre: 'Contador' },
    });
    await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', 'Bearer ' + token)
      .send({
        email: 'x3@x.com',
        password: 'password123',
        persona_id: 1,
        rol_id: 2,
      })
      .expect(201);
  });
});
