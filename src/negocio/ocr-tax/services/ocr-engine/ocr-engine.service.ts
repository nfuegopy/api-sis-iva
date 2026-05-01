/* eslint-disable prettier/prettier */

import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import * as path from 'path';

export interface OcrResult {
  rawText: string;
  confidence: number;
}

@Injectable()
export class OcrEngineService {
  private readonly logger = new Logger(OcrEngineService.name);

  // Cambiamos string por Buffer
  async extractText(imageBuffer: Buffer): Promise<OcrResult> {
    this.logger.log(`Iniciando motor OCR (Tesseract) desde memoria RAM...`);
    try {
      // Tesseract acepta el buffer directamente
      const result = await Tesseract.recognize(imageBuffer, 'spa', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`Progreso OCR: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const textoExtraido = result.data.text;
      const nivelConfianza = result.data.confidence;
      this.logger.log(
        `Lectura finalizada. Confianza general: ${nivelConfianza}%`,
      );

      return { rawText: textoExtraido, confidence: nivelConfianza };
    } catch (error) {
      this.logger.error('Fallo crítico al ejecutar Tesseract.js', error);
      throw new InternalServerErrorException(
        'No se pudo extraer el texto del comprobante',
      );
    }
  }
}
