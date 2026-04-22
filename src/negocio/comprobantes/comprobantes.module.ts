/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprobantesService } from './comprobantes.service';
import { ComprobantesController } from './comprobantes.controller';
import { Comprobante } from './entities/comprobante.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comprobante])],
  controllers: [ComprobantesController],
  providers: [ComprobantesService],
  exports: [ComprobantesService],
})
export class ComprobantesModule {}
