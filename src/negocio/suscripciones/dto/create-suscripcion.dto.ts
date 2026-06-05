/* eslint-disable prettier/prettier */
import {
  IsBoolean,
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

  @IsBoolean()
  @IsOptional()
  es_trial?: boolean;

  @IsDateString()
  @IsOptional()
  trial_hasta?: string;
}
