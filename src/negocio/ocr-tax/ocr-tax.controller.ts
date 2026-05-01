/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import 'multer';

import { ImageOptimizationService } from './services/image-optimization/image-optimization.service';
import { OcrEngineService } from './services/ocr-engine/ocr-engine.service';
import { RegexParserService } from './services/regex-parser/regex-parser.service';
import { TaxValidationService } from './services/tax-validation/tax-validation.service';
import { GoogleVisionService } from './services/google-vision/google-vision.service';

// Importa tus entidades
import { Contribuyente } from '../contribuyentes/entities/contribuyente.entity';
import { Comprobante } from '../comprobantes/entities/comprobante.entity';
import { SetRuc } from './entities/set-ruc.entity';

@Controller('ocr-tax')
export class OcrTaxController {
  private readonly logger = new Logger(OcrTaxController.name);

  constructor(
    private readonly imageService: ImageOptimizationService,
    private readonly ocrService: OcrEngineService,
    private readonly regexService: RegexParserService,
    private readonly taxService: TaxValidationService,
    private readonly visionService: GoogleVisionService,

    // Inyectamos los repositorios de la BD
    @InjectRepository(Contribuyente)
    private readonly contribuyenteRepo: Repository<Contribuyente>,
    @InjectRepository(Comprobante)
    private readonly comprobanteRepo: Repository<Comprobante>,
    @InjectRepository(SetRuc)
    private readonly setRucsRepo: Repository<SetRuc>,
  ) {}

  @Post('procesar-comprobante')
  @UseInterceptors(FileInterceptor('imagen'))
  async procesarComprobante(
    @UploadedFile() file: Express.Multer.File,
    @Body('ruc') rucContribuyenteBody: string,
  ) {
    if (!file)
      throw new BadRequestException('Debe subir una imagen del comprobante.');
    if (!rucContribuyenteBody)
      throw new BadRequestException('El RUC del cliente es obligatorio.');

    // 1. VALIDACIÓN EN BASE DE DATOS: Buscamos si el RUC que viene de Postman existe
    const [soloRuc] = rucContribuyenteBody.split('-'); // Extraemos '5116168'
    const cliente = await this.contribuyenteRepo.findOne({
      where: { ruc: soloRuc },
    });

    if (!cliente) {
      throw new BadRequestException(
        'El RUC ingresado no pertenece a ningún contribuyente registrado en el sistema.',
      );
    }

    // 2. Procesamiento de Imagen y Subida a Cloudflare R2
    const { url: urlCloudflare, buffer: bufferOptimizada } =
      await this.imageService.optimizeAndSave(
        file.buffer,
        rucContribuyenteBody,
      );

    // Le pasamos el BUFFER a Tesseract, no la URL
    let ocrResult = await this.ocrService.extractText(bufferOptimizada);

    // Hacemos un primer escaneo con lo que leyó Tesseract
    let datosExtraidos = this.regexService.parseOcrText(
      ocrResult.rawText,
      rucContribuyenteBody,
    );

    // EL VERDADERO RESCATE:
    // Si la confianza es menor a 75, O si Tesseract no pudo encontrar el RUC, O si no encontró el Nro Comprobante...
    if (
      ocrResult.confidence < 75 ||
      !datosExtraidos.ruc ||
      !datosExtraidos.nroComprobante
    ) {
      this.logger.warn(
        'Tesseract falló en extraer datos clave o dudó. Rescatando con Google Vision...',
      );

      // Le pasamos el BUFFER a Google Vision
      ocrResult = await this.visionService.extractText(bufferOptimizada);

      // Volvemos a pasar el Regex, pero esta vez sobre el texto perfecto de Google Vision
      datosExtraidos = this.regexService.parseOcrText(
        ocrResult.rawText,
        rucContribuyenteBody,
      );
    }

    const matematicamenteValido = this.taxService.validarCuadratura(
      datosExtraidos.gravada10 || 0,
      datosExtraidos.gravada5 || 0,
      datosExtraidos.exenta || 0,
      datosExtraidos.total || 0,
    );

    let estadoRevision = 'REQUIERE_REVISION';
    const tieneDatosObligatorios =
      datosExtraidos.ruc &&
      datosExtraidos.timbrado &&
      datosExtraidos.nroComprobante;

    if (
      matematicamenteValido &&
      ocrResult.confidence > 70 &&
      tieneDatosObligatorios &&
      datosExtraidos.total
    ) {
      estadoRevision = 'AUTO_PROCESADO';
    }

    // --- LÓGICA DE NEGOCIO Y CÁLCULOS ---

    // A. Cálculo automático de IVA (Regla PY: Base / 11 para 10%, Base / 21 para 5%)
    const gravada10 = datosExtraidos.gravada10
      ? parseInt(datosExtraidos.gravada10)
      : 0;
    const gravada5 = datosExtraidos.gravada5
      ? parseInt(datosExtraidos.gravada5)
      : 0;
    const exenta = datosExtraidos.exenta ? parseInt(datosExtraidos.exenta) : 0;
    const total = datosExtraidos.total ? parseInt(datosExtraidos.total) : 0;

    const iva10 = Math.round(gravada10 / 11);
    const iva5 = Math.round(gravada5 / 21);

    // B. Consulta al Espejo de la SET
    let razonSocialEmisor = 'A CONFIRMAR';

    if (datosExtraidos.ruc) {
      const [soloRucOcr] = datosExtraidos.ruc.split('-');

      this.logger.log(
        `🔍 Buscando RUC Emisor [${soloRucOcr}] en la tabla SET...`,
      );

      const datosSet = await this.setRucsRepo.findOne({
        where: { ruc: soloRucOcr },
      });

      if (datosSet) {
        this.logger.log(
          `✅ ¡SET Match! Razón Social oficial: ${datosSet.razon_social}`,
        );
        razonSocialEmisor = datosSet.razon_social; // Autocompleta el nombre oficial

        // Si el RUC está bloqueado o cancelado en la SET, forzamos revisión manual
        if (datosSet.estado !== 'ACTIVO') {
          this.logger.warn(
            `⚠️ ¡Cuidado! El RUC ${datosExtraidos.ruc} tiene estado: ${datosSet.estado} en la SET.`,
          );
          estadoRevision = 'REQUIERE_REVISION';
        }
      } else {
        this.logger.warn(
          `❌ El RUC [${soloRucOcr}] no se encontró en la base SET.`,
        );
      }
    }

    // 3. PERSISTENCIA: Guardamos el registro en la tabla comprobantes
    const nuevoComprobante = this.comprobanteRepo.create({
      contribuyente_id: cliente.id,

      ruc_emisor: datosExtraidos.ruc || 'A CONFIRMAR',
      razon_social_emisor: razonSocialEmisor, // Guardamos la Razón Social de la SET
      timbrado: datosExtraidos.timbrado || '00000000',
      nro_comprobante: datosExtraidos.nroComprobante || '000-000-0000000',

      fecha_emision:
        datosExtraidos.fechaEmision || new Date().toISOString().split('T')[0],

      monto_total: total,
      gravada_10: gravada10,
      gravada_5: gravada5,
      exenta: exenta,
      iva_10: iva10, // Insertamos el cálculo matemático
      iva_5: iva5, // Insertamos el cálculo matemático

      url_foto_webp: urlCloudflare, // <-- Guardamos la URL de Cloudflare R2
      confianza_ocr: Math.round(ocrResult.confidence),
      estado_ocr: estadoRevision,
    });

    const comprobanteGuardado =
      await this.comprobanteRepo.save(nuevoComprobante);

    // Retornamos el resultado
    return {
      mensaje: 'Comprobante procesado y guardado en la base de datos',
      comprobante_id: comprobanteGuardado.id,
      estado_ocr: estadoRevision,
      confianza: Math.round(ocrResult.confidence) + '%',
      imagen_url: urlCloudflare, // <-- Devolvemos la URL de Cloudflare R2
      datos_identificados: {
        ...datosExtraidos,
        razonSocialOficial: razonSocialEmisor,
      },
    };
  }
}
