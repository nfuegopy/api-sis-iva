import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginacionDto } from '../../../common/dto/paginacion.dto';
import { ToIntQuery } from '../../../common/dto/to-int-query.transform';

export class FiltroAsignacionesContablesDto extends PaginacionDto {
  @IsOptional()
  @ToIntQuery()
  @IsInt()
  @Min(1)
  usuario_id?: number;

  @IsOptional()
  @ToIntQuery()
  @IsInt()
  @Min(1)
  contribuyente_id?: number;
}
