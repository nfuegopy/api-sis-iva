import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdministradorGuard, esAdministrador } from './administrador.guard';

describe('AdministradorGuard & esAdministrador', () => {
  describe('esAdministrador', () => {
    it('debe retornar true si el rol es Administrador', () => {
      expect(esAdministrador({ rol: { nombre: 'Administrador' } })).toBe(true);
    });

    it('debe retornar false para roles que no son Administrador', () => {
      expect(esAdministrador({ rol: { nombre: 'Contador' } })).toBe(false);
      expect(esAdministrador({ rol: { nombre: 'Solo Lectura' } })).toBe(false);
      expect(esAdministrador({ rol: { nombre: 'administrador' } })).toBe(false);
      expect(esAdministrador({ rol: { nombre: ' Administrador' } })).toBe(
        false,
      );
      expect(esAdministrador({ rol: { nombre: '' } })).toBe(false);
    });

    it('debe retornar false si falta el rol o nombre', () => {
      expect(esAdministrador({ rol: {} })).toBe(false);
      expect(esAdministrador({ rol: null })).toBe(false);
      expect(esAdministrador({})).toBe(false);
      expect(esAdministrador(undefined)).toBe(false);
      expect(esAdministrador(null)).toBe(false);
      expect(esAdministrador({ rol: { nombre: 123 } })).toBe(false);
    });
  });

  describe('AdministradorGuard', () => {
    let guard: AdministradorGuard;

    beforeEach(() => {
      guard = new AdministradorGuard();
    });

    const createMockContext = (user: unknown): ExecutionContext => {
      return {
        switchToHttp: () => ({
          getRequest: () => ({
            user,
          }),
        }),
      } as unknown as ExecutionContext;
    };

    it('debe permitir acceso si el usuario es Administrador', () => {
      const context = createMockContext({ rol: { nombre: 'Administrador' } });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('debe lanzar ForbiddenException para otros roles', () => {
      const cases = [
        { rol: { nombre: 'Contador' } },
        { rol: { nombre: 'Solo Lectura' } },
        { rol: { nombre: 'administrador' } },
        { rol: { nombre: ' Administrador' } },
        { rol: { nombre: '' } },
        { rol: {} },
        { rol: null },
        {},
        undefined,
        null,
        { rol: { nombre: 123 } },
      ];

      cases.forEach((userCase) => {
        const context = createMockContext(userCase);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'Acceso denegado: requiere rol Administrador.',
        );
      });
    });
  });
});
