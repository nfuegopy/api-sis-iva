/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateAsignacionContableDto } from './create-asignacion-contable.dto';

export class UpdateAsignacionContableDto extends PartialType(
  CreateAsignacionContableDto,
) {}
