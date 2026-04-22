/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateComprobanteDto } from './dto/create-comprobante.dto';
import { UpdateComprobanteDto } from './dto/update-comprobante.dto';
import { Comprobante } from './entities/comprobante.entity';

@Injectable()
export class ComprobantesService {
  constructor(
    @InjectRepository(Comprobante)
    private readonly comprobanteRepository: Repository<Comprobante>,
  ) {}

  async create(
    createComprobanteDto: CreateComprobanteDto,
  ): Promise<Comprobante> {
    const nuevoComprobante =
      this.comprobanteRepository.create(createComprobanteDto);
    return await this.comprobanteRepository.save(nuevoComprobante);
  }

  // Permite filtrar comprobantes por contribuyente (crucial para estados de cuenta)
  async findAll(contribuyente_id?: number): Promise<Comprobante[]> {
    const whereCondition = contribuyente_id ? { contribuyente_id } : {};
    return await this.comprobanteRepository.find({
      where: whereCondition,
      order: { fecha_emision: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Comprobante> {
    const comprobante = await this.comprobanteRepository.findOne({
      where: { id },
      relations: ['contribuyente'],
    });
    if (!comprobante) {
      throw new NotFoundException(`Comprobante con ID ${id} no encontrado`);
    }
    return comprobante;
  }

  async update(
    id: number,
    updateComprobanteDto: UpdateComprobanteDto,
  ): Promise<Comprobante> {
    const comprobante = await this.findOne(id);
    this.comprobanteRepository.merge(comprobante, updateComprobanteDto);
    return await this.comprobanteRepository.save(comprobante);
  }

  async remove(id: number): Promise<void> {
    const comprobante = await this.findOne(id);
    await this.comprobanteRepository.remove(comprobante);
  }
}
