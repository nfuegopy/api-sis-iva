/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  UseGuards,
  Body,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
import { ComprobanteVenta } from '../comprobantes-ventas/entities/comprobante-venta.entity';
import { SetRuc } from './entities/set-ruc.entity';
import {
  OcrEntrenamiento,
  EstadoEntrenamiento,
} from './entities/ocr-entrenamiento.entity';
import { AsignacionContable } from '../asignaciones-contables/entities/asignacion-contable.entity';

// Decoradores de Seguridad
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MenuRolGuard } from '../../common/guards/menu-rol.guard';
import { RequierePermiso } from '../../common/decorators/permiso.decorator';

const CINCO_MB = 5 * 1024 * 1024;
const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const MULTER_IMAGEN_OPTIONS = {
  limits: { fileSize: CINCO_MB },
  fileFilter: (_req: any, file: Express.Multer.File, callback: any) => {
    if (TIPOS_IMAGEN_PERMITIDOS.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          `Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan JPG, PNG o WebP.`,
        ),
        false,
      );
    }
  },
};

@Controller('ocr-tax')
@UseGuards(JwtAuthGuard, MenuRolGuard)
@RequierePermiso('/ocr-tax')
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
    @InjectRepository(ComprobanteVenta)
    private readonly comprobanteVentaRepo: Repository<ComprobanteVenta>,
    @InjectRepository(SetRuc)
    private readonly setRucsRepo: Repository<SetRuc>,
    @InjectRepository(OcrEntrenamiento)
    private readonly ocrEntrenamientoRepo: Repository<OcrEntrenamiento>,
    @InjectRepository(AsignacionContable)
    private readonly asignacionRepo: Repository<AsignacionContable>,
    private readonly dataSource: DataSource,
  ) {}

  // =========================================================================
  // ENDPOINT 1: EGRESOS / COMPRAS (Tickets de Supermercado, Facturas de Proveedores)
  // =========================================================================
  @Post('extraer/compra')
  @UseInterceptors(FileInterceptor('imagen', MULTER_IMAGEN_OPTIONS))
  async extraerCompra(
    @UploadedFile() file: Express.Multer.File,
    @Body('ruc') rucContribuyenteBody: string,
    @CurrentUser() usuarioLogueado: any, // Lo dejamos por si pasas token, pero no bloquea si no lo pasas
  ) {
    if (!file)
      throw new BadRequestException('Debe subir una imagen del comprobante.');
    if (file.size === 0)
      throw new BadRequestException('El archivo subido está vacío.');
    if (!rucContribuyenteBody)
      throw new BadRequestException('El RUC del cliente es obligatorio.');

    const [soloRuc] = rucContribuyenteBody.split('-');
    const cliente = await this.contribuyenteRepo.findOne({
      where: { ruc: soloRuc },
    });

    if (!cliente) {
      throw new BadRequestException(
        'El RUC ingresado no pertenece a ningún contribuyente registrado.',
      );
    }

    // --- Capa 2: verificar asignación del usuario al contribuyente ---
    const tieneAsignacion = await this.asignacionRepo.findOne({
      where: { usuario_id: usuarioLogueado.id, contribuyente_id: cliente.id },
    });
    if (!tieneAsignacion) {
      throw new ForbiddenException(
        'No tenés asignación contable para operar este RUC.',
      );
    }

    // --- Capa 3: verificar suscripción activa ---
    const [suscCancelada] = await this.dataSource.query(
      `SELECT id FROM suscripciones WHERE contribuyente_id = ? AND estado = 'CANCELADO' AND (es_trial = FALSE OR trial_hasta < CURDATE()) LIMIT 1`,
      [cliente.id],
    );
    if (suscCancelada) {
      throw new ForbiddenException(
        'La suscripción del contribuyente está CANCELADA. Contacte al administrador.',
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

    if (!validation.isValidInvoiceCandidate) {
      throw new BadRequestException(
        'La imagen subida no parece ser un comprobante válido.',
      );
    }

    let estadoRevision =
      validation.isValidInvoiceCandidate &&
      validation.isTaxMathValid &&
      validation.isTimbradoValid &&
      ocrResult.confidence > 70
        ? 'AUTO_PROCESADO'
        : 'REQUIERE_REVISION';

    let razonSocialEmisor = 'A CONFIRMAR';
    if (datosExtraidos.ruc) {
      const [soloRucOcr] = datosExtraidos.ruc.split('-');
      const datosSet = await this.setRucsRepo.findOne({
        where: { ruc: soloRucOcr },
      });
      if (datosSet) {
        razonSocialEmisor = datosSet.razon_social;
        if (datosSet.estado !== 'ACTIVO') estadoRevision = 'REQUIERE_REVISION';
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
      tipo_comprobante_set: datosExtraidos.tipoComprobanteSet || 109,
      condicion_operacion: datosExtraidos.condicionOperacion || 1,
      imputa_iva: 'S',
      imputa_ire: 'N',
      imputa_irp: 'S',
      no_imputa: 'N',
      moneda_extranjera: 'N',
    });

    const comprobanteGuardado =
      await this.comprobanteRepo.save(nuevoComprobante);

    const nuevaCapsula = this.ocrEntrenamientoRepo.create({
      comprobante_id: comprobanteGuardado.id,
      url_imagen: urlCloudflare,
      json_maquina: {
        texto_crudo_leido: ocrResult.rawText,
        extraccion_regex: datosExtraidos,
      },
      estado_entrenamiento: EstadoEntrenamiento.PENDIENTE,
    });
    await this.ocrEntrenamientoRepo.save(nuevaCapsula);

    return {
      mensaje: 'Gasto procesado correctamente',
      comprobante_id: comprobanteGuardado.id,
      estado_ocr: estadoRevision,
      datos_identificados: datosExtraidos,
    };
  }

  // =========================================================================
  // ENDPOINT 2: INGRESOS / VENTAS (Facturas emitidas por el contribuyente)
  // =========================================================================
  @Post('extraer/venta')
  @UseInterceptors(FileInterceptor('imagen', MULTER_IMAGEN_OPTIONS))
  async extraerVenta(
    @UploadedFile() file: Express.Multer.File,
    @Body('ruc') rucContribuyenteBody: string,
    @CurrentUser() usuarioLogueado: any,
  ) {
    if (!file) throw new BadRequestException('Debe subir una imagen.');
    if (file.size === 0)
      throw new BadRequestException('El archivo subido está vacío.');
    if (!rucContribuyenteBody)
      throw new BadRequestException('El RUC del emisor es obligatorio.');

    const [soloRuc] = rucContribuyenteBody.split('-');
    const cliente = await this.contribuyenteRepo.findOne({
      where: { ruc: soloRuc },
    });

    if (!cliente) {
      throw new BadRequestException(
        'El RUC ingresado no pertenece a ningún contribuyente.',
      );
    }

    // --- Capa 2: verificar asignación del usuario al contribuyente ---
    const tieneAsignacionVenta = await this.asignacionRepo.findOne({
      where: { usuario_id: usuarioLogueado.id, contribuyente_id: cliente.id },
    });
    if (!tieneAsignacionVenta) {
      throw new ForbiddenException(
        'No tenés asignación contable para operar este RUC.',
      );
    }

    // --- Capa 3: verificar suscripción activa ---
    const [suscCanceladaVenta] = await this.dataSource.query(
      `SELECT id FROM suscripciones WHERE contribuyente_id = ? AND estado = 'CANCELADO' AND (es_trial = FALSE OR trial_hasta < CURDATE()) LIMIT 1`,
      [cliente.id],
    );
    if (suscCanceladaVenta) {
      throw new ForbiddenException(
        'La suscripción del contribuyente está CANCELADA. Contacte al administrador.',
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
      ocrResult = await this.visionService.extractText(bufferOptimizada);
      datosExtraidos = this.regexService.parseOcrText(
        ocrResult.rawText,
        rucContribuyenteBody,
      );
    }

    // Validación matemática fiscal (igual que extraerCompra)
    const invoiceResult = this.validatorService.validate(datosExtraidos);
    if (!invoiceResult.validation.isValidInvoiceCandidate) {
      throw new BadRequestException(
        'La imagen subida no parece ser un comprobante válido.',
      );
    }

    let razonSocialCliente = 'A CONFIRMAR';
    if (datosExtraidos.ruc) {
      const [soloRucOcr] = datosExtraidos.ruc.split('-');
      const datosSet = await this.setRucsRepo.findOne({
        where: { ruc: soloRucOcr },
      });
      if (datosSet) razonSocialCliente = datosSet.razon_social;
    }

    const estadoRevisionVenta =
      invoiceResult.validation.isTaxMathValid &&
      invoiceResult.validation.isTimbradoValid &&
      ocrResult.confidence > 70
        ? 'AUTO_PROCESADO'
        : 'REQUIERE_REVISION';

    const total = OcrNormalizerHelper.cleanAmount(datosExtraidos.total);
    const gravada10 = OcrNormalizerHelper.cleanAmount(datosExtraidos.gravada10);
    const fechaConvertida = OcrNormalizerHelper.parseDate(
      datosExtraidos.fechaEmision,
    );
    const fechaParaGuardar = fechaConvertida
      ? fechaConvertida.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const nuevaVenta = this.comprobanteVentaRepo.create({
      contribuyente_id: cliente.id,
      ruc_cliente: datosExtraidos.ruc || 'A CONFIRMAR',
      razon_social_cliente: razonSocialCliente,
      timbrado: datosExtraidos.timbrado || '00000000',
      nro_comprobante: datosExtraidos.nroComprobante || '000-000-0000000',
      fecha_emision: fechaParaGuardar,
      monto_total: total,
      gravada_10: gravada10,
      url_foto_webp: urlCloudflare,
      confianza_ocr: Math.round(ocrResult.confidence),
      estado_ocr: estadoRevisionVenta,
      tipo_comprobante_set: datosExtraidos.tipoComprobanteSet || 109,
      condicion_operacion: datosExtraidos.condicionOperacion || 1,
    });

    const ventaGuardada = await this.comprobanteVentaRepo.save(nuevaVenta);

    const nuevaCapsula = this.ocrEntrenamientoRepo.create({
      comprobante_venta_id: ventaGuardada.id,
      url_imagen: urlCloudflare,
      json_maquina: {
        texto_crudo_leido: ocrResult.rawText,
        extraccion_regex: datosExtraidos,
      },
      estado_entrenamiento: EstadoEntrenamiento.PENDIENTE,
    });
    await this.ocrEntrenamientoRepo.save(nuevaCapsula);

    return {
      mensaje: 'Ingreso (Venta) procesado correctamente',
      comprobante_venta_id: ventaGuardada.id,
      datos_identificados: datosExtraidos,
    };
  }
}
