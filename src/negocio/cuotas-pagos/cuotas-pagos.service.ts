/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCuotaPagoDto } from './dto/create-cuota-pago.dto';
import { UpdateCuotaPagoDto } from './dto/update-cuota-pago.dto';
import { CuotaPago } from './entities/cuota-pago.entity';

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

  // Permite traer todas las cuotas o filtrar por el ID de una suscripción
  async findAll(suscripcion_id?: number): Promise<CuotaPago[]> {
    const whereCondition = suscripcion_id ? { suscripcion_id } : {};
    return await this.cuotaPagoRepository.find({
      where: whereCondition,
      relations: ['suscripcion'],
      order: { fecha_vencimiento: 'ASC' }, // Ordenadas por vencimiento
    });
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

  async remove(id: number): Promise<void> {
    const cuota = await this.findOne(id);
    await this.cuotaPagoRepository.remove(cuota);
  }
}
