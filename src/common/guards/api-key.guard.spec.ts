import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let mockConfigService: Partial<ConfigService>;
  let mockContext: Partial<ExecutionContext>;
  let mockRequest: any;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    };
    guard = new ApiKeyGuard(mockConfigService as ConfigService);
    
    mockRequest = {
      header: jest.fn(),
    };
    
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      } as any),
    };
  });

  const setupMock = (envKey?: string, headerKey?: string) => {
    (mockConfigService.get as jest.Mock).mockReturnValue(envKey);
    mockRequest.header.mockReturnValue(headerKey);
  };

  it('1. API_KEY ausente -> rechaza', () => {
    setupMock(undefined, 'valid-header');
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow('no configurada');
  });

  it('2. API_KEY vacía -> rechaza', () => {
    setupMock('', 'valid-header');
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(UnauthorizedException);
  });

  it('3. API_KEY solo espacios -> rechaza', () => {
    setupMock('   ', 'valid-header');
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(UnauthorizedException);
  });

  it('4. header ausente -> rechaza', () => {
    setupMock('valid-env', undefined);
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow('ausente');
  });

  it('5. header incorrecto -> rechaza', () => {
    setupMock('valid-env', 'wrong-header');
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow('invalida');
  });

  it('6. API_KEY + header correctos -> permite', () => {
    setupMock('valid-env', 'valid-env');
    expect(guard.canActivate(mockContext as ExecutionContext)).toBe(true);
  });
});
