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
  UseGuards,
} from '@nestjs/common';
import { AsignacionesContablesService } from './asignaciones-contables.service';
import { CreateAsignacionContableDto } from './dto/create-asignacion-contable.dto';
import { UpdateAsignacionContableDto } from './dto/update-asignacion-contable.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MenuRolGuard } from '../../common/guards/menu-rol.guard';
import { RequierePermiso } from '../../common/decorators/permiso.decorator';
import { FiltroAsignacionesContablesDto } from './dto/filtro-asignaciones-contables.dto';

@Controller('negocio/asignaciones-contables')
@UseGuards(JwtAuthGuard, MenuRolGuard)
@RequierePermiso('/negocio/asignaciones-contables')
export class AsignacionesContablesController {
  constructor(
    private readonly asignacionesService: AsignacionesContablesService,
  ) {}

  @Post()
  create(@Body() createDto: CreateAsignacionContableDto) {
    return this.asignacionesService.create(createDto);
  }

  @Get()
  findAll(@Query() filtros: FiltroAsignacionesContablesDto) {
    return this.asignacionesService.findAll(
      filtros.page,
      filtros.limit,
      filtros.usuario_id,
      filtros.contribuyente_id,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAsignacionContableDto,
  ) {
    return this.asignacionesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionesService.remove(id);
  }
}
