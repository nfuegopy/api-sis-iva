/* eslint-disable prettier/prettier */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as path from 'path';

export interface OcrResult {
  rawText: string;
  confidence: number;
}

@Injectable()
export class GoogleVisionService {
  private readonly logger = new Logger(GoogleVisionService.name);

  private readonly client = new ImageAnnotatorClient();

  async extractText(imageBuffer: Buffer): Promise<OcrResult> {
    this.logger.warn(
      'Iniciando rescate con Google Cloud Vision API (IA Premium)...',
    );
    try {
      // Vision API también puede leer el buffer directo si se lo pasamos en este formato
      const request = {
        image: { content: imageBuffer },
      };

      const [result] = await this.client.documentTextDetection(request);
      const fullTextAnnotation = result.fullTextAnnotation;

      this.logger.log('Lectura de Google Vision completada con éxito.');
      return {
        rawText: fullTextAnnotation?.text || '',
        confidence: 99,
      };
    } catch (error) {
      this.logger.error('Fallo crítico al conectar con Google Vision', error);
      throw new InternalServerErrorException(
        'No se pudo procesar el comprobante de respaldo.',
      );
    }
  }
}
