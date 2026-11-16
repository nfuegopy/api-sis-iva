import { ConfigService } from '@nestjs/config';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export function getGoogleOAuthConfig(
  configService: ConfigService,
): GoogleOAuthConfig | null {
  const clientId = configService.get<string>('GOOGLE_CLIENT_ID')?.trim();
  const clientSecret = configService
    .get<string>('GOOGLE_CLIENT_SECRET')
    ?.trim();
  const callbackUrl = configService.get<string>('GOOGLE_CALLBACK_URL')?.trim();

  if (!clientId || !clientSecret || !callbackUrl) {
    return null;
  }

  return { clientId, clientSecret, callbackUrl };
}
