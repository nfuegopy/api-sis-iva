/* eslint-disable prettier/prettier */
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { EstadoSuscripcion } from '../entities/suscripcion.entity';

export class CreateSuscripcionDto {
  @IsInt()
  @IsNotEmpty()
  contribuyente_id: number;

  @IsEnum(EstadoSuscripcion)
  @IsOptional()
  estado?: EstadoSuscripcion;

  @IsDateString()
  @IsNotEmpty()
  fecha_inicio: string;
}
