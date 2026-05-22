/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Comprobante } from '../../comprobantes/entities/comprobante.entity';
import { ComprobanteVenta } from '../../comprobantes-ventas/entities/comprobante-venta.entity';

@Injectable()
export class Rg90BuilderService {
  // =========================================================================
  // GENERAR RG90 DE COMPRAS (EGRESOS)
  // =========================================================================
  generarCsvCompras(comprobantes: Comprobante[]): string {
    // Cabeceras exigidas por la SET (puedes ajustarlas según tu plantilla exacta)
    const cabeceras = [
      'Tipo Identificacion',
      'Numero Identificacion',
      'Nombre o Razon Social',
      'Tipo Comprobante',
      'Fecha Emision',
      'Timbrado',
      'Numero Comprobante',
      'Condicion Operacion',
      'Monto Total',
      'Importe Exento',
      'Importe Gravado 5%',
      'Importe IVA 5%',
      'Importe Gravado 10%',
      'Importe IVA 10%',
    ];

    let csvContent = cabeceras.join(';') + '\n';

    for (const comp of comprobantes) {
      // 1. Identificar si es RUC (11) o Cédula/Otro (12)
      const tipoIdentificacion = comp.ruc_emisor.includes('-') ? '11' : '12';

      // 2. Formatear la fecha de YYYY-MM-DD a DD/MM/YYYY
      const fechaParts = comp.fecha_emision.split('-');
      const fechaFormateada =
        fechaParts.length === 3
          ? `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`
          : comp.fecha_emision;

      // 3. Cálculos Matemáticos Exactos
      const gravada10 = Number(comp.gravada_10) || 0;
      const iva10 = Math.round(gravada10 / 11);

      const gravada5 = Number(comp.gravada_5) || 0;
      const iva5 = Math.round(gravada5 / 21);

      const exenta = Number(comp.exenta) || 0;
      const montoTotal =
        Number(comp.monto_total) || gravada10 + gravada5 + exenta;

      // 4. Armar la fila
      const fila = [
        tipoIdentificacion,
        comp.ruc_emisor,
        comp.razon_social_emisor,
        comp.tipo_comprobante_set || '109',
        fechaFormateada,
        comp.timbrado,
        comp.nro_comprobante,
        comp.condicion_operacion || '1',
        montoTotal,
        exenta,
        gravada5,
        iva5,
        gravada10,
        iva10,
      ];

      csvContent += fila.join(';') + '\n';
    }

    return csvContent;
  }

  // =========================================================================
  // GENERAR RG90 DE VENTAS (INGRESOS)
  // =========================================================================
  generarCsvVentas(ventas: ComprobanteVenta[]): string {
    const cabeceras = [
      'Tipo Identificacion',
      'Numero Identificacion',
      'Nombre o Razon Social',
      'Tipo Comprobante',
      'Fecha Emision',
      'Timbrado',
      'Numero Comprobante',
      'Condicion Operacion',
      'Monto Total',
      'Importe Exento',
      'Importe Gravado 5%',
      'Importe IVA 5%',
      'Importe Gravado 10%',
      'Importe IVA 10%',
    ];

    let csvContent = cabeceras.join(';') + '\n';

    for (const venta of ventas) {
      const tipoIdentificacion = venta.ruc_cliente.includes('-') ? '11' : '12';

      const fechaParts = venta.fecha_emision.split('-');
      const fechaFormateada =
        fechaParts.length === 3
          ? `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`
          : venta.fecha_emision;

      const gravada10 = Number(venta.gravada_10) || 0;
      const iva10 = Math.round(gravada10 / 11);

      // Si luego agregas gravada_5 y exenta a ventas, las usas aquí. Por ahora asumo 0
      const gravada5 = 0;
      const iva5 = 0;
      const exenta = 0;

      const montoTotal = Number(venta.monto_total) || gravada10;

      const fila = [
        tipoIdentificacion,
        venta.ruc_cliente,
        venta.razon_social_cliente,
        venta.tipo_comprobante_set || '109',
        fechaFormateada,
        venta.timbrado,
        venta.nro_comprobante,
        venta.condicion_operacion || '1',
        montoTotal,
        exenta,
        gravada5,
        iva5,
        gravada10,
        iva10,
      ];

      csvContent += fila.join(';') + '\n';
    }

    return csvContent;
  }
}
