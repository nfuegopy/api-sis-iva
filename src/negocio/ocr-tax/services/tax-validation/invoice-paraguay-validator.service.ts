// src/negocio/ocr-tax/services/tax-validation/invoice-paraguay-validator.service.ts
import { Injectable } from '@nestjs/common';
import { InvoiceData } from '../regex-parser/regex-parser.service';
import { OcrNormalizerHelper } from '../../helpers/ocr-normalizer.helper';

export interface InvoiceValidation {
  isValidInvoiceCandidate: boolean;
  isTaxMathValid: boolean;
  isTimbradoValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface ParsedInvoiceResult {
  data: InvoiceData;
  validation: InvoiceValidation;
  calculosGenerados: {
    iva10: number;
    iva5: number;
  };
}

@Injectable()
export class InvoiceParaguayValidatorService {
  validate(data: InvoiceData): ParsedInvoiceResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 1. Limpieza de montos
    const total = OcrNormalizerHelper.cleanAmount(data.total);
    const gravada10 = OcrNormalizerHelper.cleanAmount(data.gravada10);
    const gravada5 = OcrNormalizerHelper.cleanAmount(data.gravada5);
    const exenta = OcrNormalizerHelper.cleanAmount(data.exenta);

    // 2. Validación de presencia de datos clave
    let isValidInvoiceCandidate = true;
    if (!data.ruc) errors.push('No se detectó RUC del emisor.');
    if (!data.nroComprobante)
      errors.push('No se detectó número de comprobante válido.');
    if (!data.timbrado) errors.push('No se detectó timbrado.');
    if (total <= 0) errors.push('El monto total detectado es 0 o inválido.');

    if (errors.length > 2) isValidInvoiceCandidate = false;

    // 3. Validación de Fechas (Timbrado)
    let isTimbradoValid = true;
    if (data.fechaEmision && data.vencimientoTimbrado) {
      const fechaE = OcrNormalizerHelper.parseDate(data.fechaEmision);
      const fechaV = OcrNormalizerHelper.parseDate(data.vencimientoTimbrado);

      if (fechaE && fechaV) {
        if (fechaE > fechaV) {
          isTimbradoValid = false;
          warnings.push(
            'El timbrado se encontraba vencido a la fecha de emisión.',
          );
        }
      }
    } else {
      warnings.push(
        'No se pudo validar el vencimiento del timbrado por falta de fechas.',
      );
    }

    // 4. Validación Matemática (Tolerancia 100 Gs)
    let isTaxMathValid = false;
    const sumaBases = gravada10 + gravada5 + exenta;
    const diferencia = Math.abs(total - sumaBases);

    if (total > 0 && diferencia <= 100) {
      isTaxMathValid = true;
    } else {
      warnings.push(
        `Cuadratura fallida. Total(${total}) vs SumaBases(${sumaBases}). Diferencia: ${diferencia} Gs.`,
      );
    }

    // 5. Cálculos de IVA Oficiales
    const iva10 = Math.round(gravada10 / 11);
    const iva5 = Math.round(gravada5 / 21);

    return {
      data,
      validation: {
        isValidInvoiceCandidate,
        isTaxMathValid,
        isTimbradoValid,
        warnings,
        errors,
      },
      calculosGenerados: {
        iva10,
        iva5,
      },
    };
  }
}
