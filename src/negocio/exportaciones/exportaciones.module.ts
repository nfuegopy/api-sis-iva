/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportacionesController } from './exportaciones.controller';
import { Rg90BuilderService } from './services/rg90-builder.service';
import { Comprobante } from '../comprobantes/entities/comprobante.entity';
import { ComprobanteVenta } from '../comprobantes-ventas/entities/comprobante-venta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comprobante, ComprobanteVenta])],
  controllers: [ExportacionesController],
  providers: [Rg90BuilderService],
})
export class ExportacionesModule {}
