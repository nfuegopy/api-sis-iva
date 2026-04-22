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

  // Permite filtrar por contador o por contribuyente
  async findAll(
    usuario_id?: number,
    contribuyente_id?: number,
  ): Promise<AsignacionContable[]> {
    // Usamos el tipado correcto de TypeORM para evitar usar 'any'
    const whereCondition: FindOptionsWhere<AsignacionContable> = {};

    if (usuario_id) whereCondition.usuario_id = usuario_id;
    if (contribuyente_id) whereCondition.contribuyente_id = contribuyente_id;

    return await this.asignacionRepository.find({
      where: whereCondition,
      // Incluimos ambas relaciones para que al consultar devuelva todo el contexto
      relations: ['usuario', 'contribuyente'],
    });
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

  async remove(id: number): Promise<void> {
    const asignacion = await this.findOne(id);
    await this.asignacionRepository.remove(asignacion);
  }
}
