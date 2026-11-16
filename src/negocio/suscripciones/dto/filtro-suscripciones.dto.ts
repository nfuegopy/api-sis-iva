import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginacionDto } from '../../../common/dto/paginacion.dto';
import { ToIntQuery } from '../../../common/dto/to-int-query.transform';

export class FiltroSuscripcionesDto extends PaginacionDto {
  @IsOptional()
  @ToIntQuery()
  @IsInt()
  @Min(1)
  contribuyente_id?: number;
}
