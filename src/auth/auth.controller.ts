/* eslint-disable prettier/prettier */

import { Controller, Post, Body, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from 'src/gestion/usuarios/dto/create-usuario.dto';
import { UsuariosService } from 'src/gestion/usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MenuRolGuard } from 'src/common/guards/menu-rol.guard';
import { RequierePermiso } from 'src/common/decorators/permiso.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  // Login es público: no lleva guard
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.login(user);
  }

  // Register requiere JWT + permiso guardar en /usuarios
  // Evita que un anónimo se cree una cuenta con rol_id de admin
  @Post('register')
  @UseGuards(JwtAuthGuard, MenuRolGuard)
  @RequierePermiso('/usuarios')
  async register(@Body() createUsuarioDto: CreateUsuarioDto) {
    const user = await this.usuariosService.create(createUsuarioDto);
    return {
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
      },
    };
  }
}
