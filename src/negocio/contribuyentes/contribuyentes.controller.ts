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
} from '@nestjs/common';
import { ContribuyentesService } from './contribuyentes.service';
import { CreateContribuyenteDto } from './dto/create-contribuyente.dto';
import { UpdateContribuyenteDto } from './dto/update-contribuyente.dto';

@Controller('negocio/contribuyentes')
export class ContribuyentesController {
  constructor(private readonly contribuyentesService: ContribuyentesService) {}

  @Post()
  create(@Body() createContribuyenteDto: CreateContribuyenteDto) {
    return this.contribuyentesService.create(createContribuyenteDto);
  }

  @Get()
  findAll() {
    return this.contribuyentesService.findAll();
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
