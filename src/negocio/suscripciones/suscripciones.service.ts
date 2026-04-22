/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSuscripcionDto } from './dto/create-suscripcion.dto';
import { UpdateSuscripcionDto } from './dto/update-suscripcion.dto';
import { Suscripcion } from './entities/suscripcion.entity';

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

  // Útil para buscar si un contribuyente específico tiene su suscripción al día
  async findAll(contribuyente_id?: number): Promise<Suscripcion[]> {
    const whereCondition = contribuyente_id ? { contribuyente_id } : {};
    return await this.suscripcionRepository.find({
      where: whereCondition,
      relations: ['contribuyente', 'cuotas'],
    });
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

  async remove(id: number): Promise<void> {
    const suscripcion = await this.findOne(id);
    await this.suscripcionRepository.remove(suscripcion);
  }
}
