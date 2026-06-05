/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCuotaPagoDto } from './dto/create-cuota-pago.dto';
import { UpdateCuotaPagoDto } from './dto/update-cuota-pago.dto';
import { CuotaPago } from './entities/cuota-pago.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class CuotasPagosService {
  constructor(
    @InjectRepository(CuotaPago)
    private readonly cuotaPagoRepository: Repository<CuotaPago>,
  ) {}

  async create(createCuotaPagoDto: CreateCuotaPagoDto): Promise<CuotaPago> {
    const nuevaCuota = this.cuotaPagoRepository.create(createCuotaPagoDto);
    return await this.cuotaPagoRepository.save(nuevaCuota);
  }

  async findAll(
    page = 1,
    limit = 20,
    suscripcion_id?: number,
  ): Promise<PaginatedResult<CuotaPago>> {
    const where = suscripcion_id ? { suscripcion_id } : {};
    const [data, total] = await this.cuotaPagoRepository.findAndCount({
      where,
      relations: ['suscripcion'],
      order: { fecha_vencimiento: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<CuotaPago> {
    const cuota = await this.cuotaPagoRepository.findOne({
      where: { id },
      relations: ['suscripcion'],
    });
    if (!cuota) {
      throw new NotFoundException(`Cuota con ID ${id} no encontrada`);
    }
    return cuota;
  }

  async update(
    id: number,
    updateCuotaPagoDto: UpdateCuotaPagoDto,
  ): Promise<CuotaPago> {
    const cuota = await this.findOne(id);
    this.cuotaPagoRepository.merge(cuota, updateCuotaPagoDto);
    return await this.cuotaPagoRepository.save(cuota);
  }

  async remove(id: number): Promise<{ message: string }> {
    const cuota = await this.findOne(id);
    await this.cuotaPagoRepository.remove(cuota);
    return { message: `Cuota con ID ${id} eliminada.` };
  }
}
