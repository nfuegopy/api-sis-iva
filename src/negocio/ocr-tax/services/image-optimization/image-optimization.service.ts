/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT as string,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY as string,
        secretAccessKey: process.env.R2_SECRET_KEY as string,
      },
    });
  }

  // Ahora devolvemos la URL pública y el Buffer optimizado en memoria
  async optimizeAndSave(
    fileBuffer: Buffer,
    rucContribuyente: string,
  ): Promise<{ url: string; buffer: Buffer }> {
    try {
      const fechaActual = new Date();
      const anho = fechaActual.getFullYear().toString();
      const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');

      const fileName = `comprobantes/${rucContribuyente}/${anho}/${mes}/comprobante-${Date.now()}.webp`;

      // 1. Optimizamos manteniendo la imagen en la RAM
      const optimizedBuffer = await sharp(fileBuffer)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();

      // 2. Subimos a Cloudflare R2
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName,
          Body: optimizedBuffer,
          ContentType: 'image/webp',
        }),
      );

      const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
      this.logger.log(`Imagen subida a R2 exitosamente: ${publicUrl}`);

      return { url: publicUrl, buffer: optimizedBuffer };
    } catch (error) {
      this.logger.error('Error procesando imagen o subiendo a R2', error);
      throw new InternalServerErrorException(
        'Error al optimizar y subir el comprobante',
      );
    }
  }
}
