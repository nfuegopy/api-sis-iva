/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuscripcionesService } from './suscripciones.service';
import { SuscripcionesController } from './suscripciones.controller';
import { Suscripcion } from './entities/suscripcion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Suscripcion])],
  controllers: [SuscripcionesController],
  providers: [SuscripcionesService],
  exports: [SuscripcionesService], // Se exporta por si otro módulo necesita verificar estados de morosidad
})
export class SuscripcionesModule {}
