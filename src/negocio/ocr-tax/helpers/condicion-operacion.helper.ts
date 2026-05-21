/* eslint-disable prettier/prettier */
import { Logger } from '@nestjs/common';

export class CondicionOperacionHelper {
  private static readonly logger = new Logger(CondicionOperacionHelper.name);

  /**
   * Analiza el texto crudo del OCR para determinar la condición de venta,
   * considerando las sutiles marcas de bolígrafo (X, *, V) típicas de Paraguay.
   * * @param rawText El texto completo extraído por OCR
   * @param tipoComprobanteSet 112 (Ticket) o 109 (Factura)
   * @returns 1 (Contado) o 2 (Crédito)
   */
  static extraerCondicion(rawText: string, tipoComprobanteSet: number): number {
    // 1. Regla de Negocio Directa: Si es un Ticket (112), casi siempre es Contado.
    // Las cajas registradoras no tienen "casillas" para marcar con bolígrafo.
    if (tipoComprobanteSet === 112) {
      return 1; // Contado
    }

    const textSafe = rawText.toUpperCase();

    // 2. Buscar marcas sutiles de bolígrafo.
    // Los OCR suelen traducir un gancho o cruz sobre una casilla como X, V, *, o 0.
    // Expresión: Busca "CONTADO" seguido de posibles espacios, paréntesis/corchetes, y una marca.
    const regexContadoMarcado = /CONTADO\s*[:\[\]\(\)-]?\s*[XV*0]/i;
    const regexCreditoMarcado =
      /(?:CREDITO|CR[EÉ]DITO)\s*[:\[\]\(\)-]?\s*[XV*0]/i;

    // Evaluamos primero si hay una marca explícita en Crédito
    if (regexCreditoMarcado.test(textSafe)) {
      this.logger.debug('Se detectó marca de bolígrafo en casilla CRÉDITO');
      return 2;
    }

    // Evaluamos si hay una marca explícita en Contado
    if (regexContadoMarcado.test(textSafe)) {
      this.logger.debug('Se detectó marca de bolígrafo en casilla CONTADO');
      return 1;
    }

    // 3. Si el OCR no detectó la "X" (por baja resolución o trazo fino),
    // revisamos si AL MENOS una de las palabras NO está.
    // (Ej: sistemas de facturación digital que solo imprimen la palabra "CONTADO" y ocultan "CREDITO")
    const tieneContado = /\b(CONTADO)\b/i.test(textSafe);
    const tieneCredito = /\b(CREDITO|CR[EÉ]DITO)\b/i.test(textSafe);

    if (tieneCredito && !tieneContado) {
      return 2;
    }

    // 4. Fallback General: Si aparecen ambas palabras (Factura preimpresa clásica)
    // y el OCR fue incapaz de ver la marca del bolígrafo, por estadística y seguridad fiscal,
    // forzamos CONTADO y el usuario lo corregirá si hace falta.
    return 1;
  }
}
