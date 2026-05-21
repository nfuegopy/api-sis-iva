// src/negocio/ocr-tax/services/regex-parser/regex-parser.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OcrNormalizerHelper } from '../../helpers/ocr-normalizer.helper';
import { CondicionOperacionHelper } from '../../helpers/condicion-operacion.helper';
export interface InvoiceData {
  ruc?: string;
  nroComprobante?: string;
  timbrado?: string;
  vencimientoTimbrado?: string;
  fechaEmision?: string;
  total?: string;
  gravada10?: string;
  gravada5?: string;
  exenta?: string;
  // --- NUEVOS CAMPOS SET ---
  tipoComprobanteSet?: number;
  condicionOperacion?: number;
}

@Injectable()
export class RegexParserService {
  private readonly logger = new Logger(RegexParserService.name);

  parseOcrText(rawText: string, rucCliente: string): InvoiceData {
    this.logger.log(
      'Iniciando extracción con contexto para facturas y tickets de Paraguay...',
    );
    const data: InvoiceData = {};
    const textSafe = rawText.toUpperCase(); // Normalizamos a mayúsculas para simplificar regex

    // 1. RUC Emisor
    const baseClientRuc = rucCliente.split('-')[0];
    const rucRegex = /(?:^|[^\dA-Z])(\d{5,8}\s*-\s*[0-9A-Z])(?:$|[^\dA-Z])/g;
    let rucMatch;

    while ((rucMatch = rucRegex.exec(textSafe)) !== null) {
      const candidatoRuc = rucMatch[1].replace(/\s/g, '');
      const baseCandidato = candidatoRuc.split('-')[0];

      // Aseguramos no capturar el RUC del cliente
      if (baseCandidato !== baseClientRuc) {
        data.ruc = candidatoRuc;
        break; // Tomamos el primer RUC ajeno al cliente
      }
    }

    // 2. Número de Comprobante
    // Ajustado para ser un poco más flexible con los tickets que a veces no traen los 3-3-7 exactos
    const comprobanteRegex =
      /(?:N[°º]?\s*)?([0O\d]{3}[\s.-]*[0O\d]{3}[\s.-]*\d{7})/i;
    const compMatch = textSafe.match(comprobanteRegex);
    if (compMatch) {
      data.nroComprobante = OcrNormalizerHelper.normalizeComprobante(
        compMatch[1],
      );
    }

    // 3. Timbrado
    const timbradoRegex =
      /(?:TIMBRADO|TIMB|AUTORIZACI[OÓ]N)[^\d]{0,20}(\d{8})\b/i;
    const timbradoMatch = textSafe.match(timbradoRegex);
    if (timbradoMatch) {
      data.timbrado = timbradoMatch[1];
    } else {
      // Fallback seguro: un número de 8 dígitos que no coincida con la raíz del RUC
      const fallbackTimbrados = textSafe.match(/(?<!\d)\d{8}(?!\d)/g) || [];
      const raizRuc = data.ruc ? data.ruc.split('-')[0] : '';
      data.timbrado = fallbackTimbrados.find((t) => t !== raizRuc);
    }

    // 4. Vencimiento del Timbrado
    const vencimientoRegex =
      /(?:V[AÁ]LIDO HASTA|VENCE|VENCIMIENTO|FECHA FIN)[^\d]{0,20}(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/i;
    const vencMatch = textSafe.match(vencimientoRegex);
    if (vencMatch) {
      data.vencimientoTimbrado = vencMatch[1].replace(/[\.\-]/g, '/');
    }

    // 5. Fechas de Emisión (Buscamos contexto primero, sino la primera fecha encontrada)
    const emisionContextRegex =
      /(?:FECHA(?: DE EMISI[OÓ]N)?|ASUNCI[OÓ]N)[\s:.\-_]{0,20}(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/i;
    const emisionMatch = textSafe.match(emisionContextRegex);
    if (emisionMatch) {
      data.fechaEmision = emisionMatch[1].replace(/[\.\-]/g, '/');
    } else {
      // Fallback: Tomamos todas las fechas, excluimos la de vencimiento, y asumimos la más reciente
      const regexAllFechas = /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/g;
      const todasLasFechas = (textSafe.match(regexAllFechas) || []).map((f) =>
        f.replace(/[\.\-]/g, '/'),
      );
      const fechasValidas = todasLasFechas.filter(
        (f) => f !== data.vencimientoTimbrado,
      );
      if (fechasValidas.length > 0) {
        data.fechaEmision = fechasValidas[0];
      }
    }

    // 6. TOTAL (Solo buscamos montos precedidos por palabras clave)
    const regexTotalContexto =
      /(?:TOTAL(?: A PAGAR| GENERAL)?|IMPORTE TOTAL|GS|GUARAN[IÍ]ES)[\s:.\-_]{0,20}?((?:\d{1,3}(?:[.,]\d{3})+)|[0-9]{4,})/i;
    const matchTotal = textSafe.match(regexTotalContexto);
    if (matchTotal) {
      data.total = matchTotal[1];
    }

    // 7. Gravadas y Exentas
    const regexG10 =
      /(?:GRAVADAS?|GRABADAS?|LIQUIDACI[OÓ]N)[^\d]*10%[\s\S]{0,30}?((?:\d{1,3}(?:[.,]\d{3})+)|[0-9]+)/i;
    const matchG10 = textSafe.match(regexG10);
    if (matchG10) data.gravada10 = matchG10[1];

    const regexG5 =
      /(?:GRAVADAS?|GRABADAS?|LIQUIDACI[OÓ]N)[^\d]*5%[\s\S]{0,30}?((?:\d{1,3}(?:[.,]\d{3})+)|[0-9]+)/i;
    const matchG5 = textSafe.match(regexG5);
    if (matchG5) data.gravada5 = matchG5[1];

    const regexExenta =
      /(?:EXENTAS?|TOTAL EXENTO)[\s:.\-_]{0,30}?((?:\d{1,3}(?:[.,]\d{3})+)|[0-9]+)/i;
    const matchExenta = textSafe.match(regexExenta);
    if (matchExenta) data.exenta = matchExenta[1];

    // =========================================================================
    // 8. TIPO DE COMPROBANTE SET (109 = Factura, 112 = Ticket, etc.)
    // =========================================================================
    const ticketRegex =
      /\b(TICKET|MAQ\.? REG|M[AÁ]QUINA REGISTRADORA|NRO\.? SERIE)\b/i;
    if (ticketRegex.test(textSafe)) {
      data.tipoComprobanteSet = 112;
      this.logger.debug(
        'Identificado como Ticket de Máquina Registradora (112)',
      );
    } else {
      data.tipoComprobanteSet = 109; // Factura por defecto
      this.logger.debug('Identificado como Factura (109)');
    }

    // =========================================================================
    // 9. CONDICIÓN DE LA OPERACIÓN (Delega al Helper Especializado)
    // =========================================================================
    data.condicionOperacion = CondicionOperacionHelper.extraerCondicion(
      rawText,
      data.tipoComprobanteSet,
    );

    return data;
  }
}
