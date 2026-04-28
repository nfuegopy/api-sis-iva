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

  async extractText(relativePath: string): Promise<OcrResult> {
    this.logger.log(`Iniciando motor OCR en: ${relativePath}`);

    try {
      // Convertimos la ruta relativa (ej: uploads/...) a una ruta absoluta del disco
      const absolutePath = path.join(process.cwd(), relativePath);

      // Iniciamos Tesseract. Usamos 'spa' (Español) para que reconozca letras como la Ñ o acentos
      const result = await Tesseract.recognize(absolutePath, 'spa', {
        // Esto nos imprimirá en consola el progreso de lectura (0% a 100%)
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

      return {
        rawText: textoExtraido,
        confidence: nivelConfianza,
      };
    } catch (error) {
      this.logger.error('Fallo crítico al ejecutar Tesseract.js', error);
      throw new InternalServerErrorException(
        'No se pudo extraer el texto del comprobante',
      );
    }
  }
}
