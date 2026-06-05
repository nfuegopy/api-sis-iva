/* eslint-disable prettier/prettier */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: orígenes permitidos desde variable de entorno.
  // En producción: CORS_ORIGIN=https://mifrontend.com
  // Múltiples orígenes: CORS_ORIGIN=https://app.com,https://admin.app.com
  const origenes = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:4200'];

  app.enableCors({
    origin: origenes,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,             // Elimina propiedades que no están en el DTO
      forbidNonWhitelisted: true,  // Retorna 400 si llegan propiedades no declaradas
    }),
  );

  const port = process.env.PORT || 9031;
  await app.listen(port);
}
bootstrap();
