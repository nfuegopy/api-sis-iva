import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ESTADOS_OCR } from '../../../common/dto/estados-ocr';
import { PaginacionDto } from '../../../common/dto/paginacion.dto';
import { ToIntQuery } from '../../../common/dto/to-int-query.transform';

export class FiltroComprobantesDto extends PaginacionDto {
  @IsOptional()
  @ToIntQuery()
  @IsInt()
  @Min(1)
  contribuyente_id?: number;

  @IsOptional()
  @IsIn(ESTADOS_OCR)
  estado_ocr?: string;
}
