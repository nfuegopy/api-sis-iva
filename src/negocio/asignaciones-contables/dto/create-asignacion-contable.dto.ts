/* eslint-disable prettier/prettier */
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateAsignacionContableDto {
  @IsInt()
  @IsNotEmpty()
  usuario_id: number;

  @IsInt()
  @IsNotEmpty()
  contribuyente_id: number;
}
