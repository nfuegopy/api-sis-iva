/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateCuotaPagoDto } from './create-cuota-pago.dto';

export class UpdateCuotaPagoDto extends PartialType(CreateCuotaPagoDto) {}
