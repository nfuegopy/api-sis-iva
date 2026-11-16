import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { GoogleVisionService } from './../src/negocio/ocr-tax/services/google-vision/google-vision.service';
import { ConfigService } from '@nestjs/config';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dbSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock DB Connection to prevent hitting real MySQL
    dbSpy = jest.spyOn(DataSource.prototype, 'initialize').mockImplementation(async function() {
      return this;
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleVisionService)
      .useValue({ extractText: jest.fn() }) // Evitar GCP Metadata network call
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          if (key === 'GOOGLE_CLIENT_ID' || key === 'GOOGLE_CLIENT_SECRET' || key === 'GOOGLE_CALLBACK_URL') {
            return undefined; // Fuerza a deshabilitado
          }
          return process.env[key];
        }),
        getOrThrow: jest.fn((key: string) => {
          const val = process.env[key] || 'secret';
          return val;
        })
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    if (dbSpy) {
      dbSpy.mockRestore();
    }
  });

  it('/auth/google (GET) - fails without config', () => {
    return request(app.getHttpServer())
      .get('/auth/google')
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe('Google OAuth no está configurado en este entorno.');
      });
  });
});
