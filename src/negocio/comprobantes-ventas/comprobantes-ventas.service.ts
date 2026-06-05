/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ComprobanteVenta } from './entities/comprobante-venta.entity';
import { UpdateComprobanteVentaDto } from './dto/update-comprobante-venta.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class ComprobantesVentasService {
  constructor(
    @InjectRepository(ComprobanteVenta)
    private readonly ventaRepository: Repository<ComprobanteVenta>,
  ) {}

  async listarBolsaPendientes(): Promise<ComprobanteVenta[]> {
    return await this.ventaRepository.find({
      where: {
        estado_ocr: 'REQUIERE_REVISION',
        revisor_id: IsNull(),
      },
      order: { fecha_emision: 'ASC' },
    });
  }

  async reclamarParaRevision(id: number, contadorId: number) {
    const venta = await this.findOne(id);

    if (venta.revisor_id !== null && venta.revisor_id !== contadorId) {
      throw new NotFoundException('Otro contador ya reclamó esta venta.');
    }
    if (venta.revisor_id === contadorId) {
      return { mensaje: 'Ya tenés asignado este comprobante de venta', venta };
    }

    venta.revisor_id = contadorId;
    venta.fecha_reclamado = new Date();
    venta.estado_ocr = 'PROCESANDO';
    await this.ventaRepository.save(venta);

    return { mensaje: 'Comprobante de venta asignado a tu bandeja', venta };
  }

  async findAll(
    page = 1,
    limit = 20,
    contribuyente_id?: number,
  ): Promise<PaginatedResult<ComprobanteVenta>> {
    const where = contribuyente_id ? { contribuyente_id } : {};
    const [data, total] = await this.ventaRepository.findAndCount({
      where,
      order: { fecha_emision: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<ComprobanteVenta> {
    const venta = await this.ventaRepository.findOne({ where: { id } });
    if (!venta) {
      throw new NotFoundException(`Comprobante de venta con ID ${id} no encontrado`);
    }
    return venta;
  }

  async update(id: number, dto: UpdateComprobanteVentaDto): Promise<ComprobanteVenta> {
    const venta = await this.findOne(id);
    this.ventaRepository.merge(venta, dto);
    return await this.ventaRepository.save(venta);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.ventaRepository.softDelete(id);
    return { message: `Comprobante de venta con ID ${id} eliminado.` };
  }
}
