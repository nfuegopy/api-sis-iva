/* eslint-disable prettier/prettier */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MenuRolGuard } from '../../common/guards/menu-rol.guard';
import { RequierePermiso } from '../../common/decorators/permiso.decorator';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { esAdministrador } from '../../common/guards/administrador.guard';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, MenuRolGuard)
@RequierePermiso('/usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @CurrentUser() user: any,
  ) {
    if (!esAdministrador(user)) {
      throw new ForbiddenException('Solo un Administrador puede asignar roles.');
    }
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  findAll(@Query() paginacion: PaginacionDto) {
    return this.usuariosService.findAll(paginacion.page, paginacion.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @CurrentUser() user: any,
  ) {
    if (updateUsuarioDto.rol_id !== undefined && !esAdministrador(user)) {
      throw new ForbiddenException('Solo un Administrador puede asignar roles.');
    }
    return this.usuariosService.update(+id, updateUsuarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(+id);
  }
}
