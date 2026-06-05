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
import { ContribuyentesService } from './contribuyentes.service';
import { CreateContribuyenteDto } from './dto/create-contribuyente.dto';
import { UpdateContribuyenteDto } from './dto/update-contribuyente.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MenuRolGuard } from '../../common/guards/menu-rol.guard';
import { RequierePermiso } from '../../common/decorators/permiso.decorator';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

@Controller('negocio/contribuyentes')
@UseGuards(JwtAuthGuard, MenuRolGuard)
@RequierePermiso('/negocio/contribuyentes')
export class ContribuyentesController {
  constructor(private readonly contribuyentesService: ContribuyentesService) {}

  @Post()
  create(@Body() createContribuyenteDto: CreateContribuyenteDto) {
    return this.contribuyentesService.create(createContribuyenteDto);
  }

  @Get()
  findAll(@Query() paginacion: PaginacionDto) {
    return this.contribuyentesService.findAll(paginacion.page, paginacion.limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contribuyentesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContribuyenteDto: UpdateContribuyenteDto,
  ) {
    return this.contribuyentesService.update(id, updateContribuyenteDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contribuyentesService.remove(id);
  }
}
