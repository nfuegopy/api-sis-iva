/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateComprobanteDto } from './dto/create-comprobante.dto';
import { UpdateComprobanteDto } from './dto/update-comprobante.dto';
import { Comprobante } from './entities/comprobante.entity';

// NUEVO: Importamos la entidad y el Enum de la IA
import {
  OcrEntrenamiento,
  EstadoEntrenamiento,
} from '../ocr-tax/entities/ocr-entrenamiento.entity';

@Injectable()
export class ComprobantesService {
  constructor(
    @InjectRepository(Comprobante)
    private readonly comprobanteRepository: Repository<Comprobante>,

    // NUEVO: Inyectamos el repositorio de entrenamiento
    @InjectRepository(OcrEntrenamiento)
    private readonly ocrEntrenamientoRepo: Repository<OcrEntrenamiento>,
  ) {}

  async create(
    createComprobanteDto: CreateComprobanteDto,
  ): Promise<Comprobante> {
    const nuevoComprobante =
      this.comprobanteRepository.create(createComprobanteDto);
    return await this.comprobanteRepository.save(nuevoComprobante);
  }

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
    // 1. Buscamos y actualizamos la tabla principal (La contabilidad)
    const comprobante = await this.findOne(id);
    this.comprobanteRepository.merge(comprobante, updateComprobanteDto);
    const comprobanteActualizado =
      await this.comprobanteRepository.save(comprobante);

    if (updateComprobanteDto.estado_ocr === 'VERIFICADO_HUMANO') {
      await this.ocrEntrenamientoRepo.update(
        { comprobante_id: id },
        {
          json_humano: { ...comprobanteActualizado } as any,
          estado_entrenamiento: EstadoEntrenamiento.LISTO_PARA_ENTRENAR,
        },
      );
    }

    return comprobanteActualizado;
  }

  async remove(id: number): Promise<void> {
    const comprobante = await this.findOne(id);
    await this.comprobanteRepository.remove(comprobante);
  }
}
