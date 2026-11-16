import { ConfigService } from '@nestjs/config';
import { googleStrategyFactory } from './auth.module';
import { GoogleStrategy } from './strategies/google.strategy';

jest.mock('./auth.service', () => ({ AuthService: class {} }));
jest.mock('./auth.controller', () => ({ AuthController: class {} }));
jest.mock('./strategies/jwt.strategy', () => ({ JwtStrategy: class {} }));
jest.mock('./token-cleanup.service', () => ({ TokenCleanupService: class {} }));
jest.mock('./entities/password-reset-token.entity', () => ({ PasswordResetToken: class {} }));
jest.mock('./entities/refresh-token.entity', () => ({ RefreshToken: class {} }));
jest.mock('src/gestion/usuarios/usuarios.module', () => ({ UsuariosModule: class {} }));
jest.mock('src/gestion/usuarios/usuarios.service', () => ({ UsuariosService: class {} }));
jest.mock('./strategies/google.strategy', () => ({
  GoogleStrategy: class {
    constructor() {}
  }
}));

describe('AuthModule googleStrategyFactory', () => {
  it('9. Factory/provider con configuración válida => instancia GoogleStrategy', () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'id';
        if (key === 'GOOGLE_CLIENT_SECRET') return 'secret';
        if (key === 'GOOGLE_CALLBACK_URL') return 'url';
        return null;
      }),
    };

    const result = googleStrategyFactory(mockConfigService as any, {} as any);
    expect(result).toBeInstanceOf(GoogleStrategy);
  });

  it('10. Factory/provider sin configuración válida => NO instancia GoogleStrategy (null)', () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const result = googleStrategyFactory(mockConfigService as any, {} as any);
    expect(result).toBeNull();
  });
});
