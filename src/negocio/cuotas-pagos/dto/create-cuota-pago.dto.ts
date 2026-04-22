/* eslint-disable prettier/prettier */
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { EstadoCuota } from '../entities/cuota-pago.entity';

export class CreateCuotaPagoDto {
  @IsInt()
  @IsNotEmpty()
  suscripcion_id: number;

  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @IsDateString()
  @IsNotEmpty()
  fecha_vencimiento: string;

  @IsDateString()
  @IsOptional()
  fecha_pago?: string;

  @IsEnum(EstadoCuota)
  @IsOptional()
  estado?: EstadoCuota;
}
