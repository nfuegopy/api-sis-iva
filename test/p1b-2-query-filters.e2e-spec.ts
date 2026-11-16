import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ComprobantesController } from '../src/negocio/comprobantes/comprobantes.controller';
import { ComprobantesService } from '../src/negocio/comprobantes/comprobantes.service';
import { Comprobante } from '../src/negocio/comprobantes/entities/comprobante.entity';
import { ComprobantesVentasController } from '../src/negocio/comprobantes-ventas/comprobantes-ventas.controller';
import { ComprobantesVentasService } from '../src/negocio/comprobantes-ventas/comprobantes-ventas.service';
import { ComprobanteVenta } from '../src/negocio/comprobantes-ventas/entities/comprobante-venta.entity';
import { OcrEntrenamiento } from '../src/negocio/ocr-tax/entities/ocr-entrenamiento.entity';
import { SuscripcionesController } from '../src/negocio/suscripciones/suscripciones.controller';
import { SuscripcionesService } from '../src/negocio/suscripciones/suscripciones.service';
import { Suscripcion } from '../src/negocio/suscripciones/entities/suscripcion.entity';
import { CuotasPagosController } from '../src/negocio/cuotas-pagos/cuotas-pagos.controller';
import { CuotasPagosService } from '../src/negocio/cuotas-pagos/cuotas-pagos.service';
import { CuotaPago } from '../src/negocio/cuotas-pagos/entities/cuota-pago.entity';
import { AsignacionesContablesController } from '../src/negocio/asignaciones-contables/asignaciones-contables.controller';
import { AsignacionesContablesService } from '../src/negocio/asignaciones-contables/asignaciones-contables.service';
import { AsignacionContable } from '../src/negocio/asignaciones-contables/entities/asignacion-contable.entity';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { MenuRolGuard } from '../src/common/guards/menu-rol.guard';
import { SuscripcionGuard } from '../src/common/guards/suscripcion.guard';

interface FindAndCountArg {
  where: Record<string, unknown>;
  skip: number;
  take: number;
}

interface MockRepo {
  findAndCount: jest.Mock<Promise<[unknown[], number]>, [FindAndCountArg]>;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
}

const createMockRepo = (): MockRepo => ({
  findAndCount: jest
    .fn<Promise<[unknown[], number]>, [FindAndCountArg]>()
    .mockResolvedValue([[], 0]),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const VALID_ESTADOS_OCR = [
  'EN_COLA',
  'PROCESANDO',
  'AUTO_PROCESADO',
  'REQUIERE_REVISION',
  'VERIFICADO_HUMANO',
  'ERROR_PROCESAMIENTO',
] as const;

const INVALID_ID_VALUES = [
  'abc',
  '0',
  '-1',
  '1.5',
  '1e2',
  '0x10',
  '',
  '%207',
  '5abc',
];

const INVALID_ESTADO_VALUES = [
  'requiere_revision',
  'EXPORTADO',
  'LISTO_PARA_ENTRENAR',
  '',
];

describe('P1b.2 - Query Filters & Pagination DTOs (e2e)', () => {
  let app: INestApplication<App>;

  const comprobanteRepo = createMockRepo();
  const ventaRepo = createMockRepo();
  const ocrRepo = createMockRepo();
  const suscripcionRepo = createMockRepo();
  const cuotaPagoRepo = createMockRepo();
  const asignacionRepo = createMockRepo();

  const allRepos = [
    comprobanteRepo,
    ventaRepo,
    ocrRepo,
    suscripcionRepo,
    cuotaPagoRepo,
    asignacionRepo,
  ];

  const expectNoRepoCalled = () => {
    for (const repo of allRepos) {
      expect(repo.findAndCount).not.toHaveBeenCalled();
    }
  };

  const expectErrorMentionsProperty = (
    body: { message?: string | string[] },
    prop: string,
  ) => {
    const messages = Array.isArray(body.message)
      ? body.message.join(' | ')
      : String(body.message ?? '');
    expect(messages).toContain(prop);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        ComprobantesController,
        ComprobantesVentasController,
        SuscripcionesController,
        CuotasPagosController,
        AsignacionesContablesController,
      ],
      providers: [
        ComprobantesService,
        ComprobantesVentasService,
        SuscripcionesService,
        CuotasPagosService,
        AsignacionesContablesService,
        {
          provide: getRepositoryToken(Comprobante),
          useValue: comprobanteRepo,
        },
        {
          provide: getRepositoryToken(ComprobanteVenta),
          useValue: ventaRepo,
        },
        {
          provide: getRepositoryToken(OcrEntrenamiento),
          useValue: ocrRepo,
        },
        {
          provide: getRepositoryToken(Suscripcion),
          useValue: suscripcionRepo,
        },
        {
          provide: getRepositoryToken(CuotaPago),
          useValue: cuotaPagoRepo,
        },
        {
          provide: getRepositoryToken(AsignacionContable),
          useValue: asignacionRepo,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MenuRolGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SuscripcionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    for (const repo of allRepos) {
      repo.findAndCount.mockResolvedValue([[], 0]);
    }
  });

  describe('1. Sin parámetros (defaults page=1, limit=20, where={})', () => {
    it.each([
      { path: '/negocio/comprobantes', repo: comprobanteRepo },
      { path: '/negocio/comprobantes-ventas', repo: ventaRepo },
      { path: '/cobranzas/suscripciones', repo: suscripcionRepo },
      { path: '/cobranzas/cuotas-pagos', repo: cuotaPagoRepo },
      { path: '/negocio/asignaciones-contables', repo: asignacionRepo },
    ])(
      'GET $path sin query -> 200, where={}, skip=0, take=20',
      async ({ path, repo }) => {
        await request(app.getHttpServer()).get(path).expect(200);

        expect(repo.findAndCount).toHaveBeenCalledTimes(1);
        expect(repo.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {},
            skip: 0,
            take: 20,
          }),
        );
        const callArg = repo.findAndCount.mock.calls[0][0];
        expect(Object.keys(callArg.where)).toEqual([]);
      },
    );
  });

  describe('2. Filtros válidos en compras y ventas (forma BFF y combinaciones)', () => {
    it.each([
      { path: '/negocio/comprobantes', repo: comprobanteRepo },
      { path: '/negocio/comprobantes-ventas', repo: ventaRepo },
    ])(
      'GET $path?limit=60&contribuyente_id=5 -> 200, where={ contribuyente_id: 5 } (number), take=60',
      async ({ path, repo }) => {
        await request(app.getHttpServer())
          .get(`${path}?limit=60&contribuyente_id=5`)
          .expect(200);

        expect(repo.findAndCount).toHaveBeenCalledTimes(1);
        expect(repo.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { contribuyente_id: 5 },
            skip: 0,
            take: 60,
          }),
        );
        const callArg = repo.findAndCount.mock.calls[0][0];
        expect(typeof callArg.where.contribuyente_id).toBe('number');
        expect(Object.keys(callArg.where)).toEqual(['contribuyente_id']);
      },
    );

    it.each(VALID_ESTADOS_OCR)(
      'GET /negocio/comprobantes?estado_ocr=%s -> 200',
      async (estado) => {
        await request(app.getHttpServer())
          .get(`/negocio/comprobantes?estado_ocr=${estado}`)
          .expect(200);

        expect(comprobanteRepo.findAndCount).toHaveBeenCalledTimes(1);
        expect(comprobanteRepo.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { estado_ocr: estado },
            skip: 0,
            take: 20,
          }),
        );
      },
    );

    it.each(VALID_ESTADOS_OCR)(
      'GET /negocio/comprobantes-ventas?estado_ocr=%s -> 200',
      async (estado) => {
        await request(app.getHttpServer())
          .get(`/negocio/comprobantes-ventas?estado_ocr=${estado}`)
          .expect(200);

        expect(ventaRepo.findAndCount).toHaveBeenCalledTimes(1);
        expect(ventaRepo.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { estado_ocr: estado },
            skip: 0,
            take: 20,
          }),
        );
      },
    );

    it.each([
      { path: '/negocio/comprobantes', repo: comprobanteRepo },
      { path: '/negocio/comprobantes-ventas', repo: ventaRepo },
    ])(
      'GET $path?contribuyente_id=5&estado_ocr=REQUIERE_REVISION&page=2&limit=10 -> 200 (AND + paginación)',
      async ({ path, repo }) => {
        await request(app.getHttpServer())
          .get(
            `${path}?contribuyente_id=5&estado_ocr=REQUIERE_REVISION&page=2&limit=10`,
          )
          .expect(200);

        expect(repo.findAndCount).toHaveBeenCalledTimes(1);
        expect(repo.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              contribuyente_id: 5,
              estado_ocr: 'REQUIERE_REVISION',
            },
            skip: 10,
            take: 10,
          }),
        );
        const callArg = repo.findAndCount.mock.calls[0][0];
        expect(typeof callArg.where.contribuyente_id).toBe('number');
      },
    );
  });

  describe('3. Filtros válidos en suscripciones, cuotas-pagos y asignaciones-contables', () => {
    it('GET /cobranzas/suscripciones?contribuyente_id=3 -> 200, where={ contribuyente_id: 3 } (number)', async () => {
      await request(app.getHttpServer())
        .get('/cobranzas/suscripciones?contribuyente_id=3')
        .expect(200);

      expect(suscripcionRepo.findAndCount).toHaveBeenCalledTimes(1);
      expect(suscripcionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contribuyente_id: 3 },
          skip: 0,
          take: 20,
        }),
      );
      const callArg = suscripcionRepo.findAndCount.mock.calls[0][0];
      expect(typeof callArg.where.contribuyente_id).toBe('number');
    });

    it('GET /cobranzas/cuotas-pagos?suscripcion_id=4 -> 200, where={ suscripcion_id: 4 } (number)', async () => {
      await request(app.getHttpServer())
        .get('/cobranzas/cuotas-pagos?suscripcion_id=4')
        .expect(200);

      expect(cuotaPagoRepo.findAndCount).toHaveBeenCalledTimes(1);
      expect(cuotaPagoRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { suscripcion_id: 4 },
          skip: 0,
          take: 20,
        }),
      );
      const callArg = cuotaPagoRepo.findAndCount.mock.calls[0][0];
      expect(typeof callArg.where.suscripcion_id).toBe('number');
    });

    it('GET /negocio/asignaciones-contables?usuario_id=2&contribuyente_id=7 -> 200, where={ usuario_id: 2, contribuyente_id: 7 } (numbers)', async () => {
      await request(app.getHttpServer())
        .get('/negocio/asignaciones-contables?usuario_id=2&contribuyente_id=7')
        .expect(200);

      expect(asignacionRepo.findAndCount).toHaveBeenCalledTimes(1);
      expect(asignacionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { usuario_id: 2, contribuyente_id: 7 },
          skip: 0,
          take: 20,
        }),
      );
      const callArg = asignacionRepo.findAndCount.mock.calls[0][0];
      expect(typeof callArg.where.usuario_id).toBe('number');
      expect(typeof callArg.where.contribuyente_id).toBe('number');
    });

    it.each([
      { path: '/cobranzas/suscripciones', repo: suscripcionRepo },
      { path: '/cobranzas/cuotas-pagos', repo: cuotaPagoRepo },
      { path: '/negocio/asignaciones-contables', repo: asignacionRepo },
    ])(
      'GET $path?limit=100 sin filtros (forma BFF) -> 200, where={}, take=100',
      async ({ path, repo }) => {
        await request(app.getHttpServer()).get(`${path}?limit=100`).expect(200);

        expect(repo.findAndCount).toHaveBeenCalledTimes(1);
        expect(repo.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {},
            skip: 0,
            take: 100,
          }),
        );
      },
    );
  });

  describe('4. Rechazo 400 para IDs inválidos o repetidos', () => {
    it.each(INVALID_ID_VALUES)(
      'GET /negocio/comprobantes?contribuyente_id=%s -> 400',
      async (badId) => {
        const res = await request(app.getHttpServer())
          .get(`/negocio/comprobantes?contribuyente_id=${badId}`)
          .expect(400);

        expectNoRepoCalled();
        expectErrorMentionsProperty(
          res.body as { message?: string | string[] },
          'contribuyente_id',
        );
      },
    );

    it.each(INVALID_ID_VALUES)(
      'GET /negocio/comprobantes-ventas?contribuyente_id=%s -> 400',
      async (badId) => {
        const res = await request(app.getHttpServer())
          .get(`/negocio/comprobantes-ventas?contribuyente_id=${badId}`)
          .expect(400);

        expectNoRepoCalled();
        expectErrorMentionsProperty(
          res.body as { message?: string | string[] },
          'contribuyente_id',
        );
      },
    );

    it.each(INVALID_ID_VALUES)(
      'GET /cobranzas/suscripciones?contribuyente_id=%s -> 400',
      async (badId) => {
        const res = await request(app.getHttpServer())
          .get(`/cobranzas/suscripciones?contribuyente_id=${badId}`)
          .expect(400);

        expectNoRepoCalled();
        expectErrorMentionsProperty(
          res.body as { message?: string | string[] },
          'contribuyente_id',
        );
      },
    );

    it.each(INVALID_ID_VALUES)(
      'GET /cobranzas/cuotas-pagos?suscripcion_id=%s -> 400',
      async (badId) => {
        const res = await request(app.getHttpServer())
          .get(`/cobranzas/cuotas-pagos?suscripcion_id=${badId}`)
          .expect(400);

        expectNoRepoCalled();
        expectErrorMentionsProperty(
          res.body as { message?: string | string[] },
          'suscripcion_id',
        );
      },
    );

    it.each(INVALID_ID_VALUES)(
      'GET /negocio/asignaciones-contables?usuario_id=%s -> 400',
      async (badId) => {
        const res = await request(app.getHttpServer())
          .get(`/negocio/asignaciones-contables?usuario_id=${badId}`)
          .expect(400);

        expectNoRepoCalled();
        expectErrorMentionsProperty(
          res.body as { message?: string | string[] },
          'usuario_id',
        );
      },
    );

    it.each(INVALID_ID_VALUES)(
      'GET /negocio/asignaciones-contables?contribuyente_id=%s -> 400',
      async (badId) => {
        const res = await request(app.getHttpServer())
          .get(`/negocio/asignaciones-contables?contribuyente_id=${badId}`)
          .expect(400);

        expectNoRepoCalled();
        expectErrorMentionsProperty(
          res.body as { message?: string | string[] },
          'contribuyente_id',
        );
      },
    );

    it.each([
      {
        url: '/negocio/comprobantes?contribuyente_id=1&contribuyente_id=2',
        prop: 'contribuyente_id',
      },
      {
        url: '/negocio/comprobantes-ventas?contribuyente_id=1&contribuyente_id=2',
        prop: 'contribuyente_id',
      },
      {
        url: '/cobranzas/suscripciones?contribuyente_id=1&contribuyente_id=2',
        prop: 'contribuyente_id',
      },
      {
        url: '/cobranzas/cuotas-pagos?suscripcion_id=1&suscripcion_id=2',
        prop: 'suscripcion_id',
      },
      {
        url: '/negocio/asignaciones-contables?usuario_id=1&usuario_id=2',
        prop: 'usuario_id',
      },
    ])('ID repetido (array) $url -> 400', async ({ url, prop }) => {
      const res = await request(app.getHttpServer()).get(url).expect(400);

      expectNoRepoCalled();
      expectErrorMentionsProperty(
        res.body as { message?: string | string[] },
        prop,
      );
    });
  });

  describe('5. Rechazo 400 para estado_ocr inválido o repetido', () => {
    it.each(INVALID_ESTADO_VALUES)(
      'GET /negocio/comprobantes?estado_ocr=%s -> 400',
      async (badEstado) => {
        const res = await request(app.getHttpServer())
          .get(`/negocio/comprobantes?estado_ocr=${badEstado}`)
          .expect(400);

        expectNoRepoCalled();
        expectErrorMentionsProperty(
          res.body as { message?: string | string[] },
          'estado_ocr',
        );
      },
    );

    it.each(INVALID_ESTADO_VALUES)(
      'GET /negocio/comprobantes-ventas?estado_ocr=%s -> 400',
      async (badEstado) => {
        const res = await request(app.getHttpServer())
          .get(`/negocio/comprobantes-ventas?estado_ocr=${badEstado}`)
          .expect(400);

        expectNoRepoCalled();
        expectErrorMentionsProperty(
          res.body as { message?: string | string[] },
          'estado_ocr',
        );
      },
    );

    it.each(['/negocio/comprobantes', '/negocio/comprobantes-ventas'])(
      'GET %s con estado_ocr repetido -> 400',
      async (path) => {
        const res = await request(app.getHttpServer())
          .get(`${path}?estado_ocr=EN_COLA&estado_ocr=PROCESANDO`)
          .expect(400);

        expectNoRepoCalled();
        expectErrorMentionsProperty(
          res.body as { message?: string | string[] },
          'estado_ocr',
        );
      },
    );
  });

  describe('6. Rechazo 400 para claves desconocidas, filtros cruzados, paginación inválida y bolsa', () => {
    it.each([
      { url: '/negocio/comprobantes?foo=1', prop: 'foo' },
      { url: '/negocio/comprobantes?usuario_id=1', prop: 'usuario_id' },
      { url: '/negocio/comprobantes-ventas?foo=1', prop: 'foo' },
      {
        url: '/cobranzas/suscripciones?estado_ocr=EN_COLA',
        prop: 'estado_ocr',
      },
      {
        url: '/cobranzas/cuotas-pagos?contribuyente_id=1',
        prop: 'contribuyente_id',
      },
      {
        url: '/negocio/asignaciones-contables?suscripcion_id=1',
        prop: 'suscripcion_id',
      },
    ])('Clave no permitida $url -> 400', async ({ url, prop }) => {
      const res = await request(app.getHttpServer()).get(url).expect(400);

      expectNoRepoCalled();
      expectErrorMentionsProperty(
        res.body as { message?: string | string[] },
        prop,
      );
    });

    it.each([
      { query: 'page=0', prop: 'page' },
      { query: 'limit=0', prop: 'limit' },
      { query: 'limit=101', prop: 'limit' },
    ])('Paginación inválida ($query) -> 400', async ({ query, prop }) => {
      const res = await request(app.getHttpServer())
        .get(`/negocio/comprobantes?${query}`)
        .expect(400);

      expectNoRepoCalled();
      expectErrorMentionsProperty(
        res.body as { message?: string | string[] },
        prop,
      );
    });

    it.each([
      '/negocio/comprobantes/bolsa/pendientes?contribuyente_id=1',
      '/negocio/comprobantes-ventas/bolsa/pendientes?contribuyente_id=1',
    ])('Bolsa no acepta filtros (%s) -> 400', async (url) => {
      const res = await request(app.getHttpServer()).get(url).expect(400);

      expectNoRepoCalled();
      expectErrorMentionsProperty(
        res.body as { message?: string | string[] },
        'contribuyente_id',
      );
    });
  });
});
