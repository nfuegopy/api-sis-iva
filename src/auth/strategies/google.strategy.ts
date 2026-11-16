/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from 'src/gestion/usuarios/usuarios.service';

import { getGoogleOAuthConfig } from '../config/google-oauth.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    const config = getGoogleOAuthConfig(configService)!;
    
    super({
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    const nombre = profile.name?.givenName ?? profile.displayName ?? 'Usuario';
    const apellido = profile.name?.familyName ?? '';

    const user = await this.usuariosService.findOrCreateGoogleUser({
      email,
      nombre,
      apellido,
    });

    done(null, user);
  }
}
