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

  // NestJS leerá automáticamente tu google-credentials.json gracias a la variable del .env
  private readonly client = new ImageAnnotatorClient();

  async extractText(relativePath: string): Promise<OcrResult> {
    this.logger.warn(
      'Iniciando rescate con Google Cloud Vision API (IA Premium)...',
    );

    try {
      const absolutePath = path.join(process.cwd(), relativePath);

      // documentTextDetection es un algoritmo de Google especializado en documentos densos como facturas
      const [result] = await this.client.documentTextDetection(absolutePath);
      const fullTextAnnotation = result.fullTextAnnotation;

      this.logger.log('Lectura de Google Vision completada con éxito.');

      return {
        // Usamos Optional Chaining para garantizar que SIEMPRE devuelva un string
        rawText: fullTextAnnotation?.text || '',
        confidence: 99, // Le asignamos 99% porque es nuestro modelo premium de rescate
      };
    } catch (error) {
      this.logger.error('Fallo crítico al conectar con Google Vision', error);
      throw new InternalServerErrorException(
        'No se pudo procesar el comprobante de respaldo.',
      );
    }
  }
}
