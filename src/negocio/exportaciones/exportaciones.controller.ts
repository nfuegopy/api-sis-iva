/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Rg90BuilderService } from './services/rg90-builder.service';
import { Comprobante } from '../comprobantes/entities/comprobante.entity';
import { ComprobanteVenta } from '../comprobantes-ventas/entities/comprobante-venta.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MenuRolGuard } from '../../common/guards/menu-rol.guard';
import { SuscripcionGuard } from '../../common/guards/suscripcion.guard';
import { RequierePermiso } from '../../common/decorators/permiso.decorator';

@Controller('negocio/exportaciones')
@UseGuards(JwtAuthGuard, MenuRolGuard)
@RequierePermiso('/negocio/exportaciones')
export class ExportacionesController {
  constructor(
    private readonly rg90Builder: Rg90BuilderService,
    @InjectRepository(Comprobante)
    private readonly comprobantesRepo: Repository<Comprobante>,
    @InjectRepository(ComprobanteVenta)
    private readonly ventasRepo: Repository<ComprobanteVenta>,
  ) {}

  @Get('rg90/compras')
  @UseGuards(SuscripcionGuard)
  async exportarCompras(
    @Query('contribuyente_id') contribuyenteId: string,
    @Query('anio') anio: string,
    @Query('mes') mes: string, // El mes es opcional
    @Res() res: Response,
  ) {
    if (!contribuyenteId || !anio) {
      throw new BadRequestException(
        'El contribuyente_id y el anio son obligatorios.',
      );
    }

    // Lógica para filtrar por un mes específico o todo el año
    const fechaInicio = mes
      ? `${anio}-${mes.padStart(2, '0')}-01`
      : `${anio}-01-01`;
    // Truco para obtener el último día del mes:
    const fechaFin = mes
      ? new Date(Number(anio), Number(mes), 0).toISOString().split('T')[0]
      : `${anio}-12-31`;

    const comprobantes = await this.comprobantesRepo.find({
      where: {
        contribuyente_id: Number(contribuyenteId),
        fecha_emision: Between(fechaInicio, fechaFin),
      },
      order: { fecha_emision: 'ASC' },
    });

    const csvData = this.rg90Builder.generarCsvCompras(comprobantes);

    const nombreArchivo = mes
      ? `RG90_COMPRAS_${anio}_${mes}.csv`
      : `RG90_COMPRAS_${anio}_COMPLETO.csv`;

    // Configurar los headers para que el navegador lo descargue automáticamente
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${nombreArchivo}"`,
    );

    // Devolvemos el string
    return res.send(csvData);
  }

  @Get('rg90/ventas')
  @UseGuards(SuscripcionGuard)
  async exportarVentas(
    @Query('contribuyente_id') contribuyenteId: string,
    @Query('anio') anio: string,
    @Query('mes') mes: string,
    @Res() res: Response,
  ) {
    if (!contribuyenteId || !anio) {
      throw new BadRequestException(
        'El contribuyente_id y el anio son obligatorios.',
      );
    }

    const fechaInicio = mes
      ? `${anio}-${mes.padStart(2, '0')}-01`
      : `${anio}-01-01`;
    const fechaFin = mes
      ? new Date(Number(anio), Number(mes), 0).toISOString().split('T')[0]
      : `${anio}-12-31`;

    const ventas = await this.ventasRepo.find({
      where: {
        contribuyente_id: Number(contribuyenteId),
        fecha_emision: Between(fechaInicio, fechaFin),
      },
      order: { fecha_emision: 'ASC' },
    });

    const csvData = this.rg90Builder.generarCsvVentas(ventas);

    const nombreArchivo = mes
      ? `RG90_VENTAS_${anio}_${mes}.csv`
      : `RG90_VENTAS_${anio}_COMPLETO.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${nombreArchivo}"`,
    );

    return res.send(csvData);
  }
}
