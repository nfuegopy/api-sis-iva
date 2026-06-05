/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Post,
} from '@nestjs/common';
import { ComprobantesVentasService } from './comprobantes-ventas.service';
import { UpdateComprobanteVentaDto } from './dto/update-comprobante-venta.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MenuRolGuard } from '../../common/guards/menu-rol.guard';
import { RequierePermiso } from '../../common/decorators/permiso.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

@Controller('negocio/comprobantes-ventas')
@UseGuards(JwtAuthGuard, MenuRolGuard)
@RequierePermiso('/negocio/comprobantes-ventas')
export class ComprobantesVentasController {
  constructor(private readonly service: ComprobantesVentasService) {}

  @Get('bolsa/pendientes')
  listarBolsa() {
    return this.service.listarBolsaPendientes();
  }

  @Post('bolsa/:id/reclamar')
  reclamar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: any,
  ) {
    return this.service.reclamarParaRevision(id, usuario.id);
  }

  @Get()
  findAll(
    @Query() paginacion: PaginacionDto,
    @Query('contribuyente_id') contribuyente_id?: string,
  ) {
    const id = contribuyente_id ? parseInt(contribuyente_id, 10) : undefined;
    return this.service.findAll(paginacion.page, paginacion.limit, id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComprobanteVentaDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
