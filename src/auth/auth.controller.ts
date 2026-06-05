/* eslint-disable prettier/prettier */

import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from 'src/gestion/usuarios/dto/create-usuario.dto';
import { UsuariosService } from 'src/gestion/usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MenuRolGuard } from 'src/common/guards/menu-rol.guard';
import { RequierePermiso } from 'src/common/decorators/permiso.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  // Login — público con rate limit estricto (5 intentos / minuto)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    return this.authService.login(user);
  }

  // Register — requiere JWT + permiso guardar en /usuarios
  @Post('register')
  @UseGuards(JwtAuthGuard, MenuRolGuard)
  @RequierePermiso('/usuarios')
  async register(@Body() createUsuarioDto: CreateUsuarioDto) {
    const user = await this.usuariosService.create(createUsuarioDto);
    return {
      message: 'Usuario registrado exitosamente',
      user: { id: user.id, email: user.email, rol: user.rol },
    };
  }

  // Perfil del usuario autenticado — sin exponer el hash de password
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: number }) {
    const usuario = await this.usuariosService.findOne(user.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...perfil } = usuario as any;
    return perfil;
  }

  // Refresh token — rota el token (invalida el anterior, emite uno nuevo)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') token: string) {
    if (!token) throw new UnauthorizedException('refresh_token requerido');
    return this.authService.refresh(token);
  }

  // Logout — revoca el refresh token
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refresh_token') token: string) {
    if (token) await this.authService.logout(token);
    return { message: 'Sesión cerrada correctamente.' };
  }

  // Forgot password — público
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'Si el correo existe, recibirás un código de recuperación.' };
  }

  // Reset password — público, usa token del email
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.nueva_password);
    return { message: 'Contraseña actualizada correctamente.' };
  }

  // Cambiar propia contraseña — requiere JWT
  @Post('cambiar-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cambiarPassword(
    @CurrentUser() user: { id: number },
    @Body() dto: CambiarPasswordDto,
  ) {
    await this.authService.cambiarPassword(user.id, dto.password_actual, dto.nueva_password);
    return { message: 'Contraseña actualizada correctamente.' };
  }
}
