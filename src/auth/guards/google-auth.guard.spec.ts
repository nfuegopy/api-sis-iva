import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    };
    guard = new GoogleAuthGuard(mockConfigService as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw NotFoundException (404) and NOT call Passport if OAuth is disabled', () => {
    const originalCanActivate = Object.getPrototypeOf(GoogleAuthGuard.prototype).canActivate;
    const mockSuper = jest.fn();
    Object.getPrototypeOf(GoogleAuthGuard.prototype).canActivate = mockSuper;

    try {
      (mockConfigService.get as jest.Mock).mockReturnValue(undefined);

      expect(() => guard.canActivate({} as ExecutionContext)).toThrow(NotFoundException);
      expect(() => guard.canActivate({} as ExecutionContext)).toThrow('Google OAuth no está configurado en este entorno.');
      expect(mockSuper).not.toHaveBeenCalled();
    } finally {
      Object.getPrototypeOf(GoogleAuthGuard.prototype).canActivate = originalCanActivate;
    }
  });

  it('should delegate to Passport (call super.canActivate) if config is complete', () => {
    const originalCanActivate = Object.getPrototypeOf(GoogleAuthGuard.prototype).canActivate;
    const mockSuper = jest.fn().mockReturnValue(true);
    Object.getPrototypeOf(GoogleAuthGuard.prototype).canActivate = mockSuper;

    try {
      (mockConfigService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'id';
        if (key === 'GOOGLE_CLIENT_SECRET') return 'secret';
        if (key === 'GOOGLE_CALLBACK_URL') return 'url';
        return null;
      });

      const result = guard.canActivate({} as ExecutionContext);
      
      expect(result).toBe(true);
      expect(mockSuper).toHaveBeenCalled();
    } finally {
      Object.getPrototypeOf(GoogleAuthGuard.prototype).canActivate = originalCanActivate;
    }
  });
});
