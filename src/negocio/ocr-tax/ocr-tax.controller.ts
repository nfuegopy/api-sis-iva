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
import { GoogleVisionService } from './services/google-vision/google-vision.service';
import { InvoiceParaguayValidatorService } from './services/tax-validation/invoice-paraguay-validator.service';
import { OcrNormalizerHelper } from './helpers/ocr-normalizer.helper';
import { ClasificadorGastoHelper } from './helpers/clasificador-gasto.helper';
// Entidades
import { Contribuyente } from '../contribuyentes/entities/contribuyente.entity';
import { Comprobante } from '../comprobantes/entities/comprobante.entity';
import { SetRuc } from './entities/set-ruc.entity';
// NUEVA Entidad
import {
  OcrEntrenamiento,
  EstadoEntrenamiento,
} from './entities/ocr-entrenamiento.entity';

@Controller('ocr-tax')
export class OcrTaxController {
  private readonly logger = new Logger(OcrTaxController.name);

  constructor(
    private readonly imageService: ImageOptimizationService,
    private readonly ocrService: OcrEngineService,
    private readonly regexService: RegexParserService,
    private readonly visionService: GoogleVisionService,
    private readonly validatorService: InvoiceParaguayValidatorService,

    @InjectRepository(Contribuyente)
    private readonly contribuyenteRepo: Repository<Contribuyente>,
    @InjectRepository(Comprobante)
    private readonly comprobanteRepo: Repository<Comprobante>,
    @InjectRepository(SetRuc)
    private readonly setRucsRepo: Repository<SetRuc>,
    // NUEVO Repositorio inyectado
    @InjectRepository(OcrEntrenamiento)
    private readonly ocrEntrenamientoRepo: Repository<OcrEntrenamiento>,
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

    const [soloRuc] = rucContribuyenteBody.split('-');
    const cliente = await this.contribuyenteRepo.findOne({
      where: { ruc: soloRuc },
    });

    if (!cliente) {
      throw new BadRequestException(
        'El RUC ingresado no pertenece a ningún contribuyente registrado en el sistema.',
      );
    }

    const { url: urlCloudflare, buffer: bufferOptimizada } =
      await this.imageService.optimizeAndSave(
        file.buffer,
        rucContribuyenteBody,
      );

    let ocrResult = await this.ocrService.extractText(bufferOptimizada);
    let datosExtraidos = this.regexService.parseOcrText(
      ocrResult.rawText,
      rucContribuyenteBody,
    );

    if (
      ocrResult.confidence < 75 ||
      !datosExtraidos.ruc ||
      !datosExtraidos.nroComprobante
    ) {
      this.logger.warn(
        'Tesseract falló o dudó. Rescatando con Google Vision...',
      );
      ocrResult = await this.visionService.extractText(bufferOptimizada);
      datosExtraidos = this.regexService.parseOcrText(
        ocrResult.rawText,
        rucContribuyenteBody,
      );
    }

    const invoiceResult = this.validatorService.validate(datosExtraidos);
    const { validation, calculosGenerados } = invoiceResult;

    // 🛑 FILTRO ANTI-BASURA
    if (!validation.isValidInvoiceCandidate) {
      this.logger.error(
        'Filtro Anti-Basura: La imagen carece de datos fiscales básicos.',
      );
      throw new BadRequestException(
        'La imagen subida no parece ser una factura válida. No se detectaron RUC, Timbrado o Número de Comprobante legibles.',
      );
    }

    let estadoRevision = 'REQUIERE_REVISION';
    if (
      validation.isValidInvoiceCandidate &&
      validation.isTaxMathValid &&
      validation.isTimbradoValid &&
      ocrResult.confidence > 70
    ) {
      estadoRevision = 'AUTO_PROCESADO';
    }

    let razonSocialEmisor = 'A CONFIRMAR';
    if (datosExtraidos.ruc) {
      const [soloRucOcr] = datosExtraidos.ruc.split('-');
      const datosSet = await this.setRucsRepo.findOne({
        where: { ruc: soloRucOcr },
      });

      if (datosSet) {
        razonSocialEmisor = datosSet.razon_social;
        if (datosSet.estado !== 'ACTIVO') {
          estadoRevision = 'REQUIERE_REVISION';
          validation.warnings.push(
            `RUC emisor en estado SET: ${datosSet.estado}`,
          );
        }
      }
    }

    const total = OcrNormalizerHelper.cleanAmount(datosExtraidos.total);
    const gravada10 = OcrNormalizerHelper.cleanAmount(datosExtraidos.gravada10);
    const gravada5 = OcrNormalizerHelper.cleanAmount(datosExtraidos.gravada5);
    const exenta = OcrNormalizerHelper.cleanAmount(datosExtraidos.exenta);
    const categoriaIRP =
      ClasificadorGastoHelper.clasificarPorRazonSocial(razonSocialEmisor);
    const fechaConvertida = OcrNormalizerHelper.parseDate(
      datosExtraidos.fechaEmision,
    );
    const fechaParaGuardar = fechaConvertida
      ? fechaConvertida.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // 1. Guardar el Comprobante real
    const nuevoComprobante = this.comprobanteRepo.create({
      contribuyente_id: cliente.id,
      ruc_emisor: datosExtraidos.ruc || 'A CONFIRMAR',
      razon_social_emisor: razonSocialEmisor,
      timbrado: datosExtraidos.timbrado || '00000000',
      nro_comprobante: datosExtraidos.nroComprobante || '000-000-0000000',
      fecha_emision: fechaParaGuardar,
      tipo_gasto: categoriaIRP,
      monto_total: total,
      gravada_10: gravada10,
      gravada_5: gravada5,
      exenta: exenta,
      iva_10: calculosGenerados.iva10,
      iva_5: calculosGenerados.iva5,
      url_foto_webp: urlCloudflare,
      confianza_ocr: Math.round(ocrResult.confidence),
      estado_ocr: estadoRevision,
    });

    const comprobanteGuardado =
      await this.comprobanteRepo.save(nuevoComprobante);

    // 2. NUEVO: Guardar la cápsula para la Inteligencia Artificial
    const nuevaCapsula = this.ocrEntrenamientoRepo.create({
      comprobante_id: comprobanteGuardado.id,
      url_imagen: urlCloudflare,
      json_maquina: {
        texto_crudo_leido: ocrResult.rawText, // Guardamos TODO el texto sucio
        extraccion_regex: datosExtraidos, // Guardamos cómo lo interpretó tu Regex
      },
      estado_entrenamiento: EstadoEntrenamiento.PENDIENTE,
    });

    await this.ocrEntrenamientoRepo.save(nuevaCapsula);

    return {
      mensaje: 'Comprobante procesado y guardado en la base de datos',
      comprobante_id: comprobanteGuardado.id,
      estado_ocr: estadoRevision,
      confianza: Math.round(ocrResult.confidence) + '%',
      imagen_url: urlCloudflare,
      datos_identificados: {
        ...datosExtraidos,
        razonSocialOficial: razonSocialEmisor,
        categoriaSugerida: categoriaIRP,
      },
      validaciones: validation,
    };
  }
}
