import {
  Injectable,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { getGoogleOAuthConfig } from '../config/google-oauth.config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const config = getGoogleOAuthConfig(this.configService);

    if (!config) {
      throw new NotFoundException(
        'Google OAuth no está configurado en este entorno.',
      );
    }

    return super.canActivate(context);
  }
}
