/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';

export interface ExtractedData {
  ruc?: string;
  nroComprobante?: string;
  timbrado?: string;
  total?: string;
  gravada10?: string;
  gravada5?: string;
  exenta?: string;
  fechaEmision?: string;
}

@Injectable()
export class RegexParserService {
  private readonly logger = new Logger(RegexParserService.name);

  // AHORA RECIBE EL RUC DEL CLIENTE PARA IGNORARLO
  parseOcrText(rawText: string, rucCliente: string): ExtractedData {
    this.logger.log('Iniciando análisis Heurístico sobre el texto OCR...');
    const data: ExtractedData = {};

    // 1. RUC (Táctica de Eliminación)
    // Busca TODOS los RUCs, permitiendo espacios cerca del guion por fallos de tinta
    const rucRegex = /\b\d{5,8}\s*-\s*[0-9a-zA-Z]\b/g;
    const matches = rawText.match(rucRegex);

    if (matches) {
      // Limpiamos los espacios internos (ej: "80022877 - 4" -> "80022877-4")
      const rucsLimpios = matches.map((m) => m.replace(/\s/g, ''));

      // Buscamos el primero que NO sea el del cliente
      const rucEmisor = rucsLimpios.find((r) => r !== rucCliente);
      if (rucEmisor) {
        data.ruc = rucEmisor;
        this.logger.debug(`RUC Emisor encontrado: ${data.ruc}`);
      }
    }

    // 2. Comprobante (Tolerante a la letra 'O' leída como '0')
    const comprobanteMatch = rawText.match(
      /\b[0O\d]{3}[\s.-]*[0O\d]{3}[\s.-]*\d{7}\b/i,
    );
    if (comprobanteMatch) {
      data.nroComprobante = comprobanteMatch[0]
        .replace(/O/gi, '0') // Convertimos las letras O a ceros
        .replace(/[\s.]/g, '-')
        .replace(/-+/g, '-');
    }

    // 3. Timbrado
    const timbradoMatch = rawText.match(/(?<!\d)\d{8}(?!\d)/);
    if (timbradoMatch) data.timbrado = timbradoMatch[0];

    // 4. Buscar el TOTAL
    const regexTotal = /TOTAL[^\n]*?([\d]{1,3}(?:\.\d{3})+)/gi;
    let matchTotal;
    let maxTotal = 0;

    while ((matchTotal = regexTotal.exec(rawText)) !== null) {
      const valorEncontrado = parseInt(matchTotal[1].replace(/\./g, ''), 10);
      if (valorEncontrado > maxTotal) {
        maxTotal = valorEncontrado;
      }
    }

    if (maxTotal > 0) {
      data.total = maxTotal.toString();
      this.logger.debug(`Total Heurístico: ${data.total}`);
    }

    // 5. Buscar Base Gravada 5%
    const regexGravada5 =
      /(?:VENTAS|GRAVADAS?|GRABADAS?)[^\n]*5%[^\n]*?([\d]{1,3}(?:\.\d{3})+)/gi;
    const matchG5 = regexGravada5.exec(rawText);
    if (matchG5) data.gravada5 = matchG5[1].replace(/\./g, '');

    // 6. Buscar Base Gravada 10%
    const regexGravada10 =
      /(?:VENTAS|GRAVADAS?|GRABADAS?)[^\n]*10%[^\n]*?([\d]{1,3}(?:\.\d{3})+)/gi;
    const matchG10 = regexGravada10.exec(rawText);
    if (matchG10) data.gravada10 = matchG10[1].replace(/\./g, '');

    // 7. Buscar Fecha
    const regexFecha = /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/;
    const matchFecha = regexFecha.exec(rawText);
    if (matchFecha) {
      const dia = matchFecha[1];
      const mes = matchFecha[2];
      const anio = matchFecha[3];
      data.fechaEmision = `${anio}-${mes}-${dia}`;
      this.logger.debug(`Fecha encontrada: ${data.fechaEmision}`);
    }

    return data;
  }
}
