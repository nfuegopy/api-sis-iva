import { ConfigService } from '@nestjs/config';
import { getGoogleOAuthConfig } from './google-oauth.config';

describe('getGoogleOAuthConfig', () => {
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    };
  });

  const setupMock = (clientId?: string, clientSecret?: string, callbackUrl?: string) => {
    (mockConfigService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'GOOGLE_CLIENT_ID') return clientId;
      if (key === 'GOOGLE_CLIENT_SECRET') return clientSecret;
      if (key === 'GOOGLE_CALLBACK_URL') return callbackUrl;
      return null;
    });
  };

  it('1. Todas las GOOGLE_* requeridas ausentes => OAuth deshabilitado (null)', () => {
    setupMock(undefined, undefined, undefined);
    expect(getGoogleOAuthConfig(mockConfigService as ConfigService)).toBeNull();
  });

  it('2. GOOGLE_CLIENT_ID vacío => deshabilitado', () => {
    setupMock('', 'secret', 'url');
    expect(getGoogleOAuthConfig(mockConfigService as ConfigService)).toBeNull();
  });

  it('3. GOOGLE_CLIENT_SECRET vacío => deshabilitado', () => {
    setupMock('id', '', 'url');
    expect(getGoogleOAuthConfig(mockConfigService as ConfigService)).toBeNull();
  });

  it('4. GOOGLE_CALLBACK_URL vacío/ausente => deshabilitado', () => {
    setupMock('id', 'secret', '');
    expect(getGoogleOAuthConfig(mockConfigService as ConfigService)).toBeNull();

    setupMock('id', 'secret', undefined);
    expect(getGoogleOAuthConfig(mockConfigService as ConfigService)).toBeNull();
  });

  it('5. Cualquiera de las tres con solo espacios => deshabilitado', () => {
    setupMock('   ', 'secret', 'url');
    expect(getGoogleOAuthConfig(mockConfigService as ConfigService)).toBeNull();

    setupMock('id', '   ', 'url');
    expect(getGoogleOAuthConfig(mockConfigService as ConfigService)).toBeNull();

    setupMock('id', 'secret', '   ');
    expect(getGoogleOAuthConfig(mockConfigService as ConfigService)).toBeNull();
  });

  it('6. Las tres completas => configuración válida (trimeada)', () => {
    setupMock('  id  ', ' secret ', 'url');
    const result = getGoogleOAuthConfig(mockConfigService as ConfigService);
    
    expect(result).not.toBeNull();
    expect(result).toEqual({
      clientId: 'id',
      clientSecret: 'secret',
      callbackUrl: 'url',
    });
  });
});
