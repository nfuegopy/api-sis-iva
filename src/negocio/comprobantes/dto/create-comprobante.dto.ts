/* eslint-disable prettier/prettier */

import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoPapel, TipoGastoIRP } from '../entities/comprobante.entity';

// Tipos de comprobante válidos según SET Paraguay
const TIPOS_COMPROBANTE_SET = [101,102,103,104,105,106,107,108,109,110,111,112,201,202,203,204,205,206,207,208,209,210,211];

export class CreateComprobanteDto {
  @IsInt()
  @IsNotEmpty()
  contribuyente_id: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}-\d{3}-\d{7}$/, {
    message: 'nro_comprobante debe tener el formato ###-###-#######',
  })
  nro_comprobante: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'El timbrado debe tener exactamente 8 dígitos' })
  @Matches(/^\d{8}$/, { message: 'El timbrado debe contener solo dígitos' })
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
  @Min(0)
  @IsOptional()
  gravada_10?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gravada_5?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  exenta?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iva_10?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iva_5?: number;

  @IsNumber()
  @Min(1, { message: 'El monto_total debe ser mayor a 0' })
  @IsNotEmpty()
  monto_total: number;

  @IsInt()
  @IsIn(TIPOS_COMPROBANTE_SET, { message: 'tipo_comprobante_set no es un código SET válido' })
  @IsOptional()
  tipo_comprobante_set?: number;

  @IsInt()
  @IsIn([1, 2], { message: 'condicion_operacion debe ser 1 (contado) o 2 (crédito)' })
  @IsOptional()
  condicion_operacion?: number;

  @IsIn(['S', 'N'], { message: 'moneda_extranjera debe ser S o N' })
  @IsOptional()
  moneda_extranjera?: string;

  @IsIn(['S', 'N'], { message: 'imputa_iva debe ser S o N' })
  @IsOptional()
  imputa_iva?: string;

  @IsIn(['S', 'N'], { message: 'imputa_ire debe ser S o N' })
  @IsOptional()
  imputa_ire?: string;

  @IsIn(['S', 'N'], { message: 'imputa_irp debe ser S o N' })
  @IsOptional()
  imputa_irp?: string;

  @IsIn(['S', 'N'], { message: 'no_imputa debe ser S o N' })
  @IsOptional()
  no_imputa?: string;

  @IsString()
  @Matches(/^\d{3}-\d{3}-\d{7}$/, {
    message: 'comprobante_asociado debe tener el formato ###-###-#######',
  })
  @IsOptional()
  comprobante_asociado?: string;

  @IsString()
  @Length(8, 8, { message: 'El timbrado_asociado debe tener exactamente 8 dígitos' })
  @Matches(/^\d{8}$/, { message: 'timbrado_asociado debe contener solo dígitos' })
  @IsOptional()
  timbrado_asociado?: string;

  @IsUrl({}, { message: 'url_foto_webp debe ser una URL válida' })
  @IsOptional()
  url_foto_webp?: string;

  @IsEnum(TipoPapel)
  @IsOptional()
  tipo_papel?: TipoPapel;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  confianza_ocr?: number;

  @IsEnum(['EN_COLA', 'PROCESANDO', 'AUTO_PROCESADO', 'REQUIERE_REVISION', 'VERIFICADO_HUMANO', 'ERROR_PROCESAMIENTO'])
  @IsOptional()
  estado_ocr?: string;

  @IsEnum(TipoGastoIRP)
  @IsOptional()
  tipo_gasto?: TipoGastoIRP;
}
