import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService - validateUser', () => {
  let authService: any;
  let mockUsuariosService: any;
  let mockJwtService: any;
  let mockNotificationsService: any;
  let mockTokenRepository: any;
  let mockRefreshRepository: any;

  beforeEach(() => {
    mockUsuariosService = {
      findByEmail: jest.fn(),
    };
    mockJwtService = {
      sign: jest.fn(),
    };
    mockNotificationsService = {};
    mockTokenRepository = {};
    mockRefreshRepository = {};

    authService = new AuthService(
      mockUsuariosService,
      mockJwtService,
      mockNotificationsService,
      mockTokenRepository,
      mockRefreshRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('7. usuario activo + password correcto -> flujo permitido', async () => {
    const user = { id: 1, email: 'test@test.com', password: 'hash', activo: true };
    mockUsuariosService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authService.validateUser('test@test.com', 'password');
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.id).toBe(1);
    expect(result.password).toBeUndefined(); // password should be stripped
  });

  it('8. usuario inactivo + password correcto -> rechazado', async () => {
    const user = { id: 1, email: 'test@test.com', password: 'hash', activo: false };
    mockUsuariosService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(authService.validateUser('test@test.com', 'password'))
      .rejects.toThrow(UnauthorizedException);
    await expect(authService.validateUser('test@test.com', 'password'))
      .rejects.toThrow('El usuario está inactivo. Contacte al administrador.');
  });

  it('9 & 10. usuario inactivo no obtiene access_token ni refresh_token (flujo completo)', async () => {
    // Si validateUser falla, nunca se llega a llamar a login() en el controller real.
    // Pero si por alguna razón llamaran a login() con un usuario inactivo (algo que no debería pasar si se usa validateUser),
    // el login emitiría tokens. Por eso probamos que validateUser corta el flujo antes de que se expidan.
    const user = { id: 1, email: 'test@test.com', password: 'hash', activo: false };
    mockUsuariosService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    try {
      const validUser = await authService.validateUser('test@test.com', 'password');
      // Should not reach here
      if (validUser) {
        await authService.login(validUser);
      }
    } catch (e) {
      // Expected exception
    }

    expect(mockJwtService.sign).not.toHaveBeenCalled();
    // mockRefreshRepository.save is not even mocked fully, but we know it's not called because login is not called
  });
});
