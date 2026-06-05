/* eslint-disable prettier/prettier */

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createContribuyenteDto: CreateContribuyenteDto): Promise<Contribuyente> {
    const existente = await this.contribuyenteRepository.findOneBy({
      ruc: createContribuyenteDto.ruc,
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe un contribuyente con el RUC ${createContribuyenteDto.ruc}.`,
      );
    }

    try {
      const nuevo = this.contribuyenteRepository.create(createContribuyenteDto);
      return await this.contribuyenteRepository.save(nuevo);
    } catch (error) {
      if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new BadRequestException(
          `La persona con ID ${createContribuyenteDto.persona_id} no existe.`,
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Contribuyente[]> {
    return await this.contribuyenteRepository.find({ relations: ['persona'] });
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

  async update(id: number, updateContribuyenteDto: UpdateContribuyenteDto): Promise<Contribuyente> {
    const contribuyente = await this.findOne(id);
    this.contribuyenteRepository.merge(contribuyente, updateContribuyenteDto);
    return await this.contribuyenteRepository.save(contribuyente);
  }

  async remove(id: number): Promise<{ message: string }> {
    const contribuyente = await this.findOne(id);
    await this.contribuyenteRepository.remove(contribuyente);
    return { message: `Contribuyente con ID ${id} eliminado.` };
  }
}
