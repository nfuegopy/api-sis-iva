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
import { AsignacionesContablesService } from './asignaciones-contables.service';
import { CreateAsignacionContableDto } from './dto/create-asignacion-contable.dto';
import { UpdateAsignacionContableDto } from './dto/update-asignacion-contable.dto';

@Controller('negocio/asignaciones-contables')
export class AsignacionesContablesController {
  constructor(
    private readonly asignacionesService: AsignacionesContablesService,
  ) {}

  @Post()
  create(@Body() createDto: CreateAsignacionContableDto) {
    return this.asignacionesService.create(createDto);
  }

  @Get()
  findAll(
    @Query('usuario_id') usuario_id?: string,
    @Query('contribuyente_id') contribuyente_id?: string,
  ) {
    const uId = usuario_id ? parseInt(usuario_id, 10) : undefined;
    const cId = contribuyente_id ? parseInt(contribuyente_id, 10) : undefined;
    return this.asignacionesService.findAll(uId, cId);
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
