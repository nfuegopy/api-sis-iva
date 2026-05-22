/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ComprobantesService } from './comprobantes.service';
import { CreateComprobanteDto } from './dto/create-comprobante.dto';
import { UpdateComprobanteDto } from './dto/update-comprobante.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('negocio/comprobantes')
export class ComprobantesController {
  constructor(private readonly comprobantesService: ComprobantesService) {}

  // =========================================================================
  // BOLSA COMÚN (UBER) - Rutas estáticas siempre arriba de las rutas con :id
  // =========================================================================

  @Get('bolsa/pendientes')
  obtenerBolsaComun() {
    return this.comprobantesService.listarBolsaPendientes();
  }

  @Post('bolsa/:id/reclamar')
  reclamarComprobante(
    @Param('id', ParseIntPipe) idComprobante: number,
    @CurrentUser() usuarioLogueado: any,
  ) {
    // Si aún no tienes el AuthGuard activado, simulamos el ID del contador (ej: 999)
    const contadorId = usuarioLogueado?.id || 999;
    return this.comprobantesService.reclamarParaRevision(
      idComprobante,
      contadorId,
    );
  }

  // =========================================================================
  // CRUD ESTÁNDAR
  // =========================================================================

  @Post()
  create(@Body() createComprobanteDto: CreateComprobanteDto) {
    return this.comprobantesService.create(createComprobanteDto);
  }

  @Get()
  findAll(@Query('contribuyente_id') contribuyente_id?: string) {
    const id = contribuyente_id ? parseInt(contribuyente_id, 10) : undefined;
    return this.comprobantesService.findAll(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.comprobantesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateComprobanteDto: UpdateComprobanteDto,
  ) {
    return this.comprobantesService.update(id, updateComprobanteDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.comprobantesService.remove(id);
  }
}
