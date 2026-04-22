/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateSuscripcionDto } from './create-suscripcion.dto';

export class UpdateSuscripcionDto extends PartialType(CreateSuscripcionDto) {}
