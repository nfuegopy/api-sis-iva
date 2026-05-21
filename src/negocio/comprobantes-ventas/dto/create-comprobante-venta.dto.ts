/* eslint-disable prettier/prettier */
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateComprobanteVentaDto {
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

  @IsDateString()
  @IsNotEmpty()
  fecha_emision: string;

  @IsInt()
  @IsOptional()
  tipo_comprobante_set?: number;

  @IsInt()
  @IsOptional()
  condicion_operacion?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ruc_cliente: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  razon_social_cliente: string;

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
  @MaxLength(1)
  @IsOptional()
  moneda_extranjera?: string;

  @IsString()
  @MaxLength(1)
  @IsOptional()
  imputa_iva?: string;

  @IsString()
  @MaxLength(1)
  @IsOptional()
  imputa_ire?: string;

  @IsString()
  @MaxLength(1)
  @IsOptional()
  imputa_irp?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  url_foto_webp?: string;

  @IsString()
  @IsOptional()
  estado_ocr?: string;

  @IsNumber()
  @IsOptional()
  confianza_ocr?: number;
}
