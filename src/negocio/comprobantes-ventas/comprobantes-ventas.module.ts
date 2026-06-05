/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprobanteVenta } from './entities/comprobante-venta.entity';
import { ComprobantesVentasService } from './comprobantes-ventas.service';
import { ComprobantesVentasController } from './comprobantes-ventas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ComprobanteVenta])],
  controllers: [ComprobantesVentasController],
  providers: [ComprobantesVentasService],
  exports: [ComprobantesVentasService],
})
export class ComprobantesVentasModule {}
