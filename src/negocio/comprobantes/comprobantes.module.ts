import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprobantesService } from './comprobantes.service';
import { ComprobantesController } from './comprobantes.controller';
import { Comprobante } from './entities/comprobante.entity';

import { OcrEntrenamiento } from '../ocr-tax/entities/ocr-entrenamiento.entity';

@Module({
  // NUEVO: Agrega OcrEntrenamiento al forFeature
  imports: [TypeOrmModule.forFeature([Comprobante, OcrEntrenamiento])],
  controllers: [ComprobantesController],
  providers: [ComprobantesService],
  exports: [ComprobantesService],
})
export class ComprobantesModule {}
