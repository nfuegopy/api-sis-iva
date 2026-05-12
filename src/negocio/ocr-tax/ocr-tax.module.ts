import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcrTaxController } from './ocr-tax.controller';
import { ImageOptimizationService } from './services/image-optimization/image-optimization.service';
import { OcrEngineService } from './services/ocr-engine/ocr-engine.service';
import { RegexParserService } from './services/regex-parser/regex-parser.service';
import { GoogleVisionService } from './services/google-vision/google-vision.service';
import { OcrEntrenamiento } from './entities/ocr-entrenamiento.entity';
// Importa el nuevo servicio
import { InvoiceParaguayValidatorService } from './services/tax-validation/invoice-paraguay-validator.service';

import { Contribuyente } from '../contribuyentes/entities/contribuyente.entity';
import { Comprobante } from '../comprobantes/entities/comprobante.entity';
import { SetRuc } from './entities/set-ruc.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contribuyente,
      Comprobante,
      SetRuc,
      OcrEntrenamiento,
    ]),
  ],
  controllers: [OcrTaxController],
  providers: [
    ImageOptimizationService,
    OcrEngineService,
    RegexParserService,
    GoogleVisionService,
    InvoiceParaguayValidatorService, // <--- Reemplaza al anterior aquí
  ],
})
export class OcrTaxModule {}
