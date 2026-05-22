// src/negocio/ocr-tax/helpers/ocr-normalizer.helper.ts

export class OcrNormalizerHelper {
  /**
   * Limpia montos eliminando letras, puntos y comas, devolviendo el número entero en Guaraníes.
   */
  static cleanAmount(value?: string): number {
    if (!value) return 0;
    const digitsOnly = value.replace(/[^\d]/g, '');
    return parseInt(digitsOnly, 10) || 0;
  }

  /**
   * Corrige errores comunes de lectura en el formato 000-000-0000000
   */
  static normalizeComprobante(value?: string): string | undefined {
    if (!value) return undefined;

    // Convertir letras O/o a 0 y normalizar separadores a guiones
    let clean = value.replace(/[Oo]/g, '0').replace(/[\s._]/g, '-');
    // Eliminar guiones múltiples
    clean = clean.replace(/-+/g, '-');

    // Extraer exactamente el patrón 3-3-7
    const match = clean.match(/(\d{3})-(\d{3})-(\d{7})/);
    return match ? match[0] : undefined;
  }

  /**
   * Convierte un string DD/MM/YYYY o DD-MM-YYYY a Date
   */
  static parseDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);

    const parsedDate = new Date(year, month, day);
    // Validar que la fecha sea real
    if (
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month &&
      parsedDate.getDate() === day
    ) {
      return parsedDate;
    }
    return null;
  }
}
