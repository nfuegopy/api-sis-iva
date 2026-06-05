/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { ComprobanteVenta } from './entities/comprobante-venta.entity';
import { CreateComprobanteVentaDto } from './dto/create-comprobante-venta.dto';
import { UpdateComprobanteVentaDto } from './dto/update-comprobante-venta.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import {
  OcrEntrenamiento,
  EstadoEntrenamiento,
} from '../ocr-tax/entities/ocr-entrenamiento.entity';

@Injectable()
export class ComprobantesVentasService {
  constructor(
    @InjectRepository(ComprobanteVenta)
    private readonly ventaRepository: Repository<ComprobanteVenta>,
    @InjectRepository(OcrEntrenamiento)
    private readonly ocrEntrenamientoRepo: Repository<OcrEntrenamiento>,
  ) {}

  async listarBolsaPendientes(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<ComprobanteVenta>> {
    const [data, total] = await this.ventaRepository.findAndCount({
      where: {
        estado_ocr: 'REQUIERE_REVISION',
        revisor_id: IsNull(),
      },
      order: { fecha_emision: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async create(dto: CreateComprobanteVentaDto): Promise<ComprobanteVenta> {
    const duplicado = await this.ventaRepository.findOne({
      where: {
        contribuyente_id: dto.contribuyente_id,
        timbrado: dto.timbrado,
        nro_comprobante: dto.nro_comprobante,
        ruc_cliente: dto.ruc_cliente,
      },
    });
    if (duplicado) {
      throw new ConflictException(
        `Comprobante duplicado: timbrado ${dto.timbrado} / nro ${dto.nro_comprobante} ya existe para este contribuyente y cliente.`,
      );
    }
    const nueva = this.ventaRepository.create(dto);
    return await this.ventaRepository.save(nueva);
  }

  async findAll(
    page = 1,
    limit = 20,
    contribuyente_id?: number,
    estado_ocr?: string,
  ): Promise<PaginatedResult<ComprobanteVenta>> {
    const where: FindOptionsWhere<ComprobanteVenta> = {};
    if (contribuyente_id) where.contribuyente_id = contribuyente_id;
    if (estado_ocr) where.estado_ocr = estado_ocr;

    const [data, total] = await this.ventaRepository.findAndCount({
      where,
      order: { fecha_emision: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<ComprobanteVenta> {
    const venta = await this.ventaRepository.findOne({
      where: { id },
      relations: ['contribuyente'],
    });
    if (!venta) {
      throw new NotFoundException(`Comprobante de venta con ID ${id} no encontrado`);
    }
    return venta;
  }

  async update(id: number, dto: UpdateComprobanteVentaDto): Promise<ComprobanteVenta> {
    const venta = await this.findOne(id);
    this.ventaRepository.merge(venta, dto);
    const ventaActualizada = await this.ventaRepository.save(venta);

    if (dto.estado_ocr === 'VERIFICADO_HUMANO') {
      await this.ocrEntrenamientoRepo.update(
        { comprobante_venta_id: id },
        {
          json_humano: { ...ventaActualizada } as any,
          estado_entrenamiento: EstadoEntrenamiento.LISTO_PARA_ENTRENAR,
        },
      );
    }

    return ventaActualizada;
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.ventaRepository.softDelete(id);
    return { message: `Comprobante de venta con ID ${id} eliminado.` };
  }
}
