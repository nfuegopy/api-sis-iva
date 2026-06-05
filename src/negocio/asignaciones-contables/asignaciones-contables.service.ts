/* eslint-disable prettier/prettier */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { CreateAsignacionContableDto } from './dto/create-asignacion-contable.dto';
import { UpdateAsignacionContableDto } from './dto/update-asignacion-contable.dto';
import { AsignacionContable } from './entities/asignacion-contable.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class AsignacionesContablesService {
  constructor(
    @InjectRepository(AsignacionContable)
    private readonly asignacionRepository: Repository<AsignacionContable>,
  ) {}

  async create(
    createDto: CreateAsignacionContableDto,
  ): Promise<AsignacionContable> {
    // Validar que no exista la misma asignación previamente
    const existe = await this.asignacionRepository.findOne({
      where: {
        usuario_id: createDto.usuario_id,
        contribuyente_id: createDto.contribuyente_id,
      },
    });

    if (existe) {
      throw new ConflictException(
        'Este usuario ya está asignado a dicho contribuyente.',
      );
    }

    const nuevaAsignacion = this.asignacionRepository.create(createDto);
    return await this.asignacionRepository.save(nuevaAsignacion);
  }

  async findAll(
    page = 1,
    limit = 20,
    usuario_id?: number,
    contribuyente_id?: number,
  ): Promise<PaginatedResult<AsignacionContable>> {
    const where: FindOptionsWhere<AsignacionContable> = {};
    if (usuario_id) where.usuario_id = usuario_id;
    if (contribuyente_id) where.contribuyente_id = contribuyente_id;

    const [data, total] = await this.asignacionRepository.findAndCount({
      where,
      relations: ['usuario', 'contribuyente'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<AsignacionContable> {
    const asignacion = await this.asignacionRepository.findOne({
      where: { id },
      relations: ['usuario', 'contribuyente'],
    });

    if (!asignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }
    return asignacion;
  }

  async update(
    id: number,
    updateDto: UpdateAsignacionContableDto,
  ): Promise<AsignacionContable> {
    const asignacion = await this.findOne(id);
    this.asignacionRepository.merge(asignacion, updateDto);
    return await this.asignacionRepository.save(asignacion);
  }

  async remove(id: number): Promise<{ message: string }> {
    const asignacion = await this.findOne(id);
    await this.asignacionRepository.remove(asignacion);
    return { message: `Asignación con ID ${id} eliminada.` };
  }
}
