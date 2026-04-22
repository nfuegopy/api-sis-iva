/* eslint-disable prettier/prettier */

import { PartialType } from '@nestjs/mapped-types';
import { CreateContribuyenteDto } from './create-contribuyente.dto';

export class UpdateContribuyenteDto extends PartialType(
  CreateContribuyenteDto,
) {}
