/* eslint-disable prettier/prettier */

import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoPapel, TipoGastoIRP } from '../entities/comprobante.entity';

export class CreateComprobanteDto {
  @IsInt()
  @IsNotEmpty()
  contribuyente_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  nro_comprobante: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  timbrado: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ruc_emisor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  razon_social_emisor: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_emision: string;

  @IsNumber()
  @IsOptional()
  gravada_10?: number;

  @IsNumber()
  @IsOptional()
  gravada_5?: number;

  @IsNumber()
  @IsOptional()
  exenta?: number;

  @IsNumber()
  @IsOptional()
  iva_10?: number;

  @IsNumber()
  @IsOptional()
  iva_5?: number;

  @IsNumber()
  @IsNotEmpty()
  monto_total: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  url_foto_webp?: string;

  @IsEnum(TipoPapel)
  @IsOptional()
  tipo_papel?: TipoPapel;

  @IsNumber()
  @IsOptional()
  confianza_ocr?: number;

  @IsString()
  @IsOptional()
  estado_ocr?: string;

  @IsEnum(TipoGastoIRP)
  @IsOptional()
  tipo_gasto?: TipoGastoIRP;
}
