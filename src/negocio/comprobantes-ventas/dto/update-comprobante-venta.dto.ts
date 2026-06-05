/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateComprobanteVentaDto } from './create-comprobante-venta.dto';

export class UpdateComprobanteVentaDto extends PartialType(CreateComprobanteVentaDto) {}
