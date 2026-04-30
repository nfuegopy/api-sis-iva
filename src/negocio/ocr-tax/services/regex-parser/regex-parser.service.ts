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

  parseOcrText(rawText: string, rucCliente: string): ExtractedData {
    this.logger.log('Iniciando análisis Heurístico V2.2 sobre el texto OCR...');
    const data: ExtractedData = {};

    // -------------------------------------------------------------
    // 1. RUC (Táctica de Eliminación Inteligente)
    // Usamos (?<!\d) y (?!\d) en lugar de \b para evitar fallos con los márgenes
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // 1. RUC (Tolerancia a caracteres basura en los bordes)
    // -------------------------------------------------------------
    // Usamos (?:^|[^\d]) para asegurar que empiece sin un número pegado
    const rucRegex = /(?:^|[^\d])(\d{5,8}\s*-\s*[0-9a-zA-Z])(?:$|[^\d])/g;
    let rucMatch;
    const rucsEncontrados: { ruc: string; index: number }[] = [];

    while ((rucMatch = rucRegex.exec(rawText)) !== null) {
      rucsEncontrados.push({
        ruc: rucMatch[1].replace(/\s/g, ''), // match[1] captura solo el grupo del RUC
        index: rucMatch.index,
      });
    }

    if (rucsEncontrados.length > 0) {
      rucsEncontrados.sort((a, b) => a.index - b.index);
      const baseClientRuc = rucCliente.split('-')[0].substring(0, 5);

      for (const item of rucsEncontrados) {
        const baseFoundRuc = item.ruc.split('-')[0];
        if (!baseFoundRuc.startsWith(baseClientRuc)) {
          data.ruc = item.ruc;
          this.logger.debug(`RUC Emisor encontrado: ${data.ruc}`);
          break;
        }
      }
    }

    // -------------------------------------------------------------
    // 2. Comprobante
    // -------------------------------------------------------------
    const comprobanteMatch = rawText.match(
      /\b[0O\d]{3}[\s.-]*[0O\d]{3}[\s.-]*\d{7}\b/i,
    );
    if (comprobanteMatch) {
      data.nroComprobante = comprobanteMatch[0]
        .replace(/O/gi, '0')
        .replace(/[\s.]/g, '-')
        .replace(/-+/g, '-');
    }

    // -------------------------------------------------------------
    // 3. Timbrado
    // -------------------------------------------------------------
    const timbradoExplicitoRegex =
      /(?:TIMBRADO|TIMB|VIGENCIA|VIG)[^\d]{0,20}(\d{8})/i;
    const matchT = rawText.match(timbradoExplicitoRegex);
    if (matchT) {
      data.timbrado = matchT[1];
    } else {
      const fallbackMatch = rawText.match(/(?<!\d)\d{8}(?!\d)/g);
      if (fallbackMatch) {
        const raizRuc = data.ruc ? data.ruc.split('-')[0] : '';
        const timbradoValido = fallbackMatch.find((t) => t !== raizRuc);
        if (timbradoValido) data.timbrado = timbradoValido;
      }
    }

    // -------------------------------------------------------------
    // 4. TOTAL
    // Permitimos formato con puntos o números puros ((?:\d{1,3}(?:\.\d{3})+)|[0-9]+)
    // -------------------------------------------------------------
    const regexTotal =
      /(?:TOTAL|PAGAR|GS|GUARANIES)[\s\S]{0,50}?((?:\d{1,3}(?:\.\d{3})+)|[0-9]+)/gi;
    let maxTotal = 0;
    let matchTotal;

    while ((matchTotal = regexTotal.exec(rawText)) !== null) {
      const valorEncontrado = parseInt(matchTotal[1].replace(/\./g, ''), 10);
      if (valorEncontrado > maxTotal) maxTotal = valorEncontrado;
    }

    if (maxTotal === 0) {
      const todosLosNumeros = rawText.match(/\b\d{1,3}(?:\.\d{3})+\b/g);
      if (todosLosNumeros) {
        const valores = todosLosNumeros.map((n) =>
          parseInt(n.replace(/\./g, ''), 10),
        );
        maxTotal = Math.max(...valores);
      }
    }

    if (maxTotal > 0) {
      data.total = maxTotal.toString();
    }

    // -------------------------------------------------------------
    // 5 y 6. Bases Gravadas (Permite '0' y ya no busca 'IMPUESTO')
    // -------------------------------------------------------------
    const regexG5 =
      /(?:GRAVADAS?|GRABADAS?|TOTAL\s*VENTAS?|LIQUIDACION)[a-zA-Z\s]{0,20}5%[\s\S]{0,80}?((?:\d{1,3}(?:\.\d{3})+)|[0-9]+)/i;
    const matchG5 = regexG5.exec(rawText);
    if (matchG5) data.gravada5 = matchG5[1].replace(/\./g, '');

    const regexG10 =
      /(?:GRAVADAS?|GRABADAS?|TOTAL\s*VENTAS?|LIQUIDACION)[a-zA-Z\s]{0,20}10%[\s\S]{0,80}?((?:\d{1,3}(?:\.\d{3})+)|[0-9]+)/i;
    const matchG10 = regexG10.exec(rawText);
    if (matchG10) data.gravada10 = matchG10[1].replace(/\./g, '');

    const regexExenta =
      /(?:EXENTAS?|TOTAL\s*EXENTO)[\s\S]{0,80}?((?:\d{1,3}(?:\.\d{3})+)|[0-9]+)/i;
    const matchEx = regexExenta.exec(rawText);
    if (matchEx) data.exenta = matchEx[1].replace(/\./g, '');

    // -------------------------------------------------------------
    // 7. FECHAS
    // -------------------------------------------------------------
    const regexFecha = /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/g;
    let matchF;
    const fechasEncontradas: Date[] = [];
    const ahora = new Date();

    while ((matchF = regexFecha.exec(rawText)) !== null) {
      const dia = parseInt(matchF[1], 10);
      const mes = parseInt(matchF[2], 10) - 1;
      const anio = parseInt(matchF[3], 10);
      const fechaParseada = new Date(anio, mes, dia);

      if (fechaParseada <= ahora) {
        fechasEncontradas.push(fechaParseada);
      }
    }

    if (fechasEncontradas.length > 0) {
      fechasEncontradas.sort((a, b) => b.getTime() - a.getTime());
      const fechaCorrecta = fechasEncontradas[0];
      const d = String(fechaCorrecta.getDate()).padStart(2, '0');
      const m = String(fechaCorrecta.getMonth() + 1).padStart(2, '0');
      const y = fechaCorrecta.getFullYear();

      data.fechaEmision = `${y}-${m}-${d}`;
    }

    return data;
  }
}
