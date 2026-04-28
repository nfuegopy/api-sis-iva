/* eslint-disable prettier/prettier */

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);

  async optimizeAndSave(
    fileBuffer: Buffer,
    rucContribuyente: string,
  ): Promise<string> {
    try {
      const fechaActual = new Date();
      const anho = fechaActual.getFullYear().toString();
      const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');

      const uploadDir = path.join(
        process.cwd(),
        'uploads',
        rucContribuyente,
        anho,
        mes,
      );

      await fs.mkdir(uploadDir, { recursive: true });

      const fileName = `comprobante-${Date.now()}.webp`;
      const filePath = path.join(uploadDir, fileName);

      await sharp(fileBuffer)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(filePath);

      this.logger.log(`Imagen guardada y optimizada en: ${filePath}`);

      return path.join('uploads', rucContribuyente, anho, mes, fileName);
    } catch (error) {
      this.logger.error('Error procesando imagen con Sharp', error);
      throw new InternalServerErrorException(
        'Error al optimizar la imagen del comprobante',
      );
    }
  }
}
