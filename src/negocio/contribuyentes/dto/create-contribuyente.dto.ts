/* eslint-disable prettier/prettier */

import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoImpuesto } from '../entities/contribuyente.entity';

export class CreateContribuyenteDto {
  @IsInt()
  @IsNotEmpty()
  persona_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ruc: string;

  @IsInt()
  @IsNotEmpty()
  dv: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  razon_social: string;

  @IsEnum(TipoImpuesto)
  @IsNotEmpty()
  tipo_impuesto: TipoImpuesto;
}
