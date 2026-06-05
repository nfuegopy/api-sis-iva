/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateComprobanteDto } from './dto/create-comprobante.dto';
import { UpdateComprobanteDto } from './dto/update-comprobante.dto';
import { Comprobante } from './entities/comprobante.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

// Importamos la entidad y el Enum de la IA
import {
  OcrEntrenamiento,
  EstadoEntrenamiento,
} from '../ocr-tax/entities/ocr-entrenamiento.entity';

@Injectable()
export class ComprobantesService {
  constructor(
    @InjectRepository(Comprobante)
    private readonly comprobanteRepository: Repository<Comprobante>,

    @InjectRepository(OcrEntrenamiento)
    private readonly ocrEntrenamientoRepo: Repository<OcrEntrenamiento>,
  ) {}

  // =========================================================================
  // LÓGICA DE BOLSA COMÚN (UBER)
  // =========================================================================

  async listarBolsaPendientes(): Promise<Comprobante[]> {
    return await this.comprobanteRepository.find({
      where: {
        estado_ocr: 'REQUIERE_REVISION',
        revisor_id: IsNull(), // Solo trae las que nadie ha reclamado aún
      },
      order: {
        fecha_emision: 'ASC', // FIFO: Las más antiguas se revisan primero
      },
      relations: ['contribuyente'], // Para que el contador sepa a qué cliente pertenece
    });
  }

  async reclamarParaRevision(idComprobante: number, contadorId: number) {
    // Usamos el findOne que ya tienes creado abajo para aprovechar sus validaciones
    const comprobante = await this.findOne(idComprobante);

    // Si alguien más ya lo tomó, rebotamos la petición
    if (
      comprobante.revisor_id !== null &&
      comprobante.revisor_id !== contadorId
    ) {
      throw new BadRequestException(
        '¡Ups! Otro contador ya reclamó esta factura. Actualiza tu bolsa.',
      );
    }

    // Prevención: Si el mismo contador hace doble clic sin querer, devolvemos OK
    if (comprobante.revisor_id === contadorId) {
      return { mensaje: 'Ya tienes asignado este comprobante', comprobante };
    }

    // Asignamos el comprobante al contador y cambiamos el estado
    comprobante.revisor_id = contadorId;
    comprobante.fecha_reclamado = new Date();
    comprobante.estado_ocr = 'PROCESANDO';

    await this.comprobanteRepository.save(comprobante);

    return {
      mensaje: 'Comprobante asignado exitosamente a tu bandeja',
      comprobante,
    };
  }

  // =========================================================================
  // CRUD ESTÁNDAR
  // =========================================================================

  async create(
    createComprobanteDto: CreateComprobanteDto,
  ): Promise<Comprobante> {
    const nuevoComprobante =
      this.comprobanteRepository.create(createComprobanteDto);
    return await this.comprobanteRepository.save(nuevoComprobante);
  }

  async findAll(
    page = 1,
    limit = 20,
    contribuyente_id?: number,
  ): Promise<PaginatedResult<Comprobante>> {
    const where = contribuyente_id ? { contribuyente_id } : {};
    const [data, total] = await this.comprobanteRepository.findAndCount({
      where,
      order: { fecha_emision: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

    // 2. Lógica de Entrenamiento IA que ya tenías armada
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

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.comprobanteRepository.softDelete(id);
    return { message: `Comprobante con ID ${id} eliminado.` };
  }
}
