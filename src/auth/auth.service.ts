/* eslint-disable prettier/prettier */

import {
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UsuariosService } from 'src/gestion/usuarios/usuarios.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from 'src/gestion/usuarios/entities/usuario.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { NotificationsService } from '../common/notifications/notifications.service';

type ValidatedUser = Omit<Usuario, 'password' | 'hashPassword'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, pass: string): Promise<ValidatedUser | null> {
    const user = await this.usuariosService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as ValidatedUser;
    }
    return null;
  }

  async login(user: ValidatedUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.persona.nombre,
      apellido: user.persona.apellido,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = await this.generarRefreshToken(user.id);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.persona.nombre,
        apellido: user.persona.apellido,
        rol: user.rol,
      },
    };
  }

  private async generarRefreshToken(usuarioId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
    await this.refreshRepository.save({ usuario_id: usuarioId, token, expira_en: expira });
    return token;
  }

  async refresh(token: string): Promise<{ access_token: string; refresh_token: string }> {
    const registro = await this.refreshRepository.findOne({
      where: { token, revocado: false, expira_en: MoreThan(new Date()) },
    });

    if (!registro) {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    // Rotación: invalidar el token anterior y emitir uno nuevo
    registro.revocado = true;
    await this.refreshRepository.save(registro);

    const usuario = await this.usuariosService.findOne(registro.usuario_id);
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.persona.nombre,
      apellido: usuario.persona.apellido,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: await this.generarRefreshToken(usuario.id),
    };
  }

  async logout(token: string): Promise<void> {
    await this.refreshRepository.update({ token }, { revocado: true });
  }

  // Genera token y envía email. Siempre responde OK (no revela si el email existe).
  async forgotPassword(email: string): Promise<void> {
    const usuario = await this.usuariosService.findByEmail(email);
    if (!usuario || !usuario.activo) return;

    await this.tokenRepository.delete({ usuario_id: usuario.id, usado: false });

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.tokenRepository.save({
      usuario_id: usuario.id,
      token,
      expira_en: expira,
    });

    this.notificationsService
      .sendResetPasswordEmail(usuario.email, usuario.persona.nombre, token)
      .catch((err: Error) =>
        this.logger.error(`Error enviando reset a ${email}: ${err.message}`),
      );
  }

  async resetPassword(token: string, nuevaPassword: string): Promise<void> {
    const registro = await this.tokenRepository.findOne({
      where: { token, usado: false, expira_en: MoreThan(new Date()) },
    });

    if (!registro) {
      throw new BadRequestException('El código de recuperación es inválido o expiró.');
    }

    const hash = await bcrypt.hash(nuevaPassword, 10);
    await this.usuariosService.updatePassword(registro.usuario_id, hash);

    registro.usado = true;
    await this.tokenRepository.save(registro);
  }

  async cambiarPassword(
    usuarioId: number,
    passwordActual: string,
    nuevaPassword: string,
  ): Promise<void> {
    const usuario = await this.usuariosService.findOne(usuarioId);

    const valida = await bcrypt.compare(passwordActual, usuario.password);
    if (!valida) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    const hash = await bcrypt.hash(nuevaPassword, 10);
    await this.usuariosService.updatePassword(usuarioId, hash);
  }
}
