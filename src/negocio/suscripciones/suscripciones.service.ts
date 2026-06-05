/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSuscripcionDto } from './dto/create-suscripcion.dto';
import { UpdateSuscripcionDto } from './dto/update-suscripcion.dto';
import { Suscripcion } from './entities/suscripcion.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class SuscripcionesService {
  constructor(
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepository: Repository<Suscripcion>,
  ) {}

  async create(
    createSuscripcionDto: CreateSuscripcionDto,
  ): Promise<Suscripcion> {
    const nuevaSuscripcion =
      this.suscripcionRepository.create(createSuscripcionDto);
    return await this.suscripcionRepository.save(nuevaSuscripcion);
  }

  async findAll(
    page = 1,
    limit = 20,
    contribuyente_id?: number,
  ): Promise<PaginatedResult<Suscripcion>> {
    const where = contribuyente_id ? { contribuyente_id } : {};
    const [data, total] = await this.suscripcionRepository.findAndCount({
      where,
      relations: ['contribuyente', 'cuotas'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Suscripcion> {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id },
      relations: ['contribuyente', 'cuotas'],
    });
    if (!suscripcion) {
      throw new NotFoundException(`Suscripción con ID ${id} no encontrada`);
    }
    return suscripcion;
  }

  async update(
    id: number,
    updateSuscripcionDto: UpdateSuscripcionDto,
  ): Promise<Suscripcion> {
    const suscripcion = await this.findOne(id);
    this.suscripcionRepository.merge(suscripcion, updateSuscripcionDto);
    return await this.suscripcionRepository.save(suscripcion);
  }

  async remove(id: number): Promise<{ message: string }> {
    const suscripcion = await this.findOne(id);
    await this.suscripcionRepository.remove(suscripcion);
    return { message: `Suscripción con ID ${id} eliminada.` };
  }
}
