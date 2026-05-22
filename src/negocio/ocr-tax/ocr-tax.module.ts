/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcrTaxController } from './ocr-tax.controller';
import { ImageOptimizationService } from './services/image-optimization/image-optimization.service';
import { OcrEngineService } from './services/ocr-engine/ocr-engine.service';
import { RegexParserService } from './services/regex-parser/regex-parser.service';
import { GoogleVisionService } from './services/google-vision/google-vision.service';
import { OcrEntrenamiento } from './entities/ocr-entrenamiento.entity';
import { InvoiceParaguayValidatorService } from './services/tax-validation/invoice-paraguay-validator.service';

import { Contribuyente } from '../contribuyentes/entities/contribuyente.entity';
import { Comprobante } from '../comprobantes/entities/comprobante.entity';
import { SetRuc } from './entities/set-ruc.entity';
import { ComprobanteVenta } from '../comprobantes-ventas/entities/comprobante-venta.entity';

// 🛡️ NUEVO: Importamos la entidad de Asignaciones Contables para el Portero
import { AsignacionContable } from '../asignaciones-contables/entities/asignacion-contable.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contribuyente,
      Comprobante,
      ComprobanteVenta,
      SetRuc,
      OcrEntrenamiento,
      AsignacionContable, // Agregado al TypeORM feature
    ]),
  ],
  controllers: [OcrTaxController],
  providers: [
    ImageOptimizationService,
    OcrEngineService,
    RegexParserService,
    GoogleVisionService,
    InvoiceParaguayValidatorService,
  ],
})
export class OcrTaxModule {}
