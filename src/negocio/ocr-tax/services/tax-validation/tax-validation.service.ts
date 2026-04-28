/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TaxValidationService {
  private readonly logger = new Logger(TaxValidationService.name);

  /**
   * Limpia el texto sucio del OCR y lo convierte en un número entero (Guaraníes)
   * Ejemplo: "150.000 Gs." -> 150000
   */
  limpiarMonto(montoStr: string | number): number {
    if (!montoStr) return 0;
    if (typeof montoStr === 'number') return montoStr;

    // Quita todo lo que NO sea un dígito numérico (puntos, comas, letras, espacios)
    const limpio = montoStr.replace(/[^\d]/g, '');
    return parseInt(limpio, 10) || 0;
  }

  /**
   * Valida que la suma de las bases imponibles y exentas coincida con el total
   */
  validarCuadratura(
    gravada10: any,
    gravada5: any,
    exenta: any,
    total: any,
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const g10 = this.limpiarMonto(gravada10);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const g5 = this.limpiarMonto(gravada5);
    const ex = this.limpiarMonto(exenta);
    const tot = this.limpiarMonto(total);

    const sumaCalculada = g10 + g5 + ex;

    this.logger.log(
      `Validando OCR: G10(${g10}) + G5(${g5}) + EX(${ex}) = Suma(${sumaCalculada}) vs Total(${tot})`,
    );

    // Si la matemática no es exacta, retornamos false (Requiere Revisión Humana)
    if (sumaCalculada !== tot) {
      this.logger.warn(
        'La suma de la factura no cuadra. Se requerirá revisión manual.',
      );
      return false;
    }

    return true;
  }

  /**
   * Calcula el impuesto exacto a partir de las bases gravadas (Cálculo SET)
   */
  calcularLiquidacion(gravada10: any, gravada5: any) {
    const g10 = this.limpiarMonto(gravada10);
    const g5 = this.limpiarMonto(gravada5);

    return {
      iva_10: Math.round(g10 / 11),
      iva_5: Math.round(g5 / 21),
    };
  }
}
