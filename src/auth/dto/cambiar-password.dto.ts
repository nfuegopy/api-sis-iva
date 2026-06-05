/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  @IsNotEmpty()
  password_actual: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  nueva_password: string;
}
