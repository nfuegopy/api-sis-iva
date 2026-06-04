/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from 'src/gestion/usuarios/usuarios.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number; email: string }) {
    let usuario;
    try {
      usuario = await this.usuariosService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException('Token inválido.');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo.');
    }

    // Este objeto se inyecta como request.user en cada request autenticado
    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol, // { id, nombre, descripcion } — necesario para MenuRolGuard
    };
  }
}
