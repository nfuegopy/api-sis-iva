import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcrTaxController } from './ocr-tax.controller';
import { ImageOptimizationService } from './services/image-optimization/image-optimization.service';
import { OcrEngineService } from './services/ocr-engine/ocr-engine.service';
import { RegexParserService } from './services/regex-parser/regex-parser.service';
import { TaxValidationService } from './services/tax-validation/tax-validation.service';
import { GoogleVisionService } from './services/google-vision/google-vision.service';
import { Contribuyente } from '../contribuyentes/entities/contribuyente.entity';
import { Comprobante } from '../comprobantes/entities/comprobante.entity';
import { SetRuc } from './entities/set-ruc.entity';
@Module({
  imports: [
    // Habilitamos los repositorios para este módulo
    TypeOrmModule.forFeature([Contribuyente, Comprobante, SetRuc]),
  ],
  controllers: [OcrTaxController],
  providers: [
    ImageOptimizationService,
    OcrEngineService,
    RegexParserService,
    TaxValidationService,
    GoogleVisionService,
  ],
})
export class OcrTaxModule {}
