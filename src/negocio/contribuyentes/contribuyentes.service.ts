/* eslint-disable prettier/prettier */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContribuyenteDto } from './dto/create-contribuyente.dto';
import { UpdateContribuyenteDto } from './dto/update-contribuyente.dto';
import { Contribuyente } from './entities/contribuyente.entity';

@Injectable()
export class ContribuyentesService {
  constructor(
    @InjectRepository(Contribuyente)
    private readonly contribuyenteRepository: Repository<Contribuyente>,
  ) {}

  async create(
    createContribuyenteDto: CreateContribuyenteDto,
  ): Promise<Contribuyente> {
    const nuevoContribuyente = this.contribuyenteRepository.create(
      createContribuyenteDto,
    );
    return await this.contribuyenteRepository.save(nuevoContribuyente);
  }

  async findAll(): Promise<Contribuyente[]> {
    return await this.contribuyenteRepository.find({
      relations: ['persona'],
    });
  }

  async findOne(id: number): Promise<Contribuyente> {
    const contribuyente = await this.contribuyenteRepository.findOne({
      where: { id },
      relations: ['persona'],
    });
    if (!contribuyente) {
      throw new NotFoundException(`Contribuyente con ID ${id} no encontrado`);
    }
    return contribuyente;
  }

  async update(
    id: number,
    updateContribuyenteDto: UpdateContribuyenteDto,
  ): Promise<Contribuyente> {
    const contribuyente = await this.findOne(id);
    this.contribuyenteRepository.merge(contribuyente, updateContribuyenteDto);
    return await this.contribuyenteRepository.save(contribuyente);
  }

  async remove(id: number): Promise<void> {
    const contribuyente = await this.findOne(id);
    await this.contribuyenteRepository.remove(contribuyente);
  }
}
