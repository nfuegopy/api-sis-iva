import { parseBootstrapAdminConfig, BOOTSTRAP_PASSWORD_MIN_LENGTH } from './bootstrap-admin.config';

describe('parseBootstrapAdminConfig', () => {
  it('ok:false, error nombra la variable para variables faltantes y vacías', () => {
    const res = parseBootstrapAdminConfig({});
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors).toContain('Falta BOOTSTRAP_ADMIN_EMAIL');
      expect(res.errors).toContain('Falta BOOTSTRAP_ADMIN_PASSWORD');
      expect(res.errors).toContain('Falta BOOTSTRAP_ADMIN_NOMBRE');
      expect(res.errors).toContain('Falta BOOTSTRAP_ADMIN_APELLIDO');
    }

    const res2 = parseBootstrapAdminConfig({
      BOOTSTRAP_ADMIN_EMAIL: '',
      BOOTSTRAP_ADMIN_PASSWORD: '',
      BOOTSTRAP_ADMIN_NOMBRE: '',
      BOOTSTRAP_ADMIN_APELLIDO: '',
    });
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.errors).toContain('Falta BOOTSTRAP_ADMIN_EMAIL');
      expect(res2.errors).toContain('Falta BOOTSTRAP_ADMIN_PASSWORD');
      expect(res2.errors).toContain('Falta BOOTSTRAP_ADMIN_NOMBRE');
      expect(res2.errors).toContain('Falta BOOTSTRAP_ADMIN_APELLIDO');
    }
  });

  it('email inválido: ok:false, mensaje no contiene el valor', () => {
    const res = parseBootstrapAdminConfig({
      BOOTSTRAP_ADMIN_EMAIL: 'invalid-email',
      BOOTSTRAP_ADMIN_PASSWORD: 'password-valida-123',
      BOOTSTRAP_ADMIN_NOMBRE: 'Nombre',
      BOOTSTRAP_ADMIN_APELLIDO: 'Apellido',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors).toContain('Formato inválido en BOOTSTRAP_ADMIN_EMAIL');
      expect(res.errors.join(' ')).not.toContain('invalid-email');
    }
  });

  it('password de 11 chars: ok:false, mensaje no contiene el valor', () => {
    const res = parseBootstrapAdminConfig({
      BOOTSTRAP_ADMIN_EMAIL: 'admin@ejemplo.com',
      BOOTSTRAP_ADMIN_PASSWORD: 'password11c',
      BOOTSTRAP_ADMIN_NOMBRE: 'Nombre',
      BOOTSTRAP_ADMIN_APELLIDO: 'Apellido',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.join(' ')).not.toContain('password11c');
    }
  });

  it('password de exactamente 12 chars: ok:true', () => {
    const res = parseBootstrapAdminConfig({
      BOOTSTRAP_ADMIN_EMAIL: 'admin@ejemplo.com',
      BOOTSTRAP_ADMIN_PASSWORD: 'password1234',
      BOOTSTRAP_ADMIN_NOMBRE: 'Nombre',
      BOOTSTRAP_ADMIN_APELLIDO: 'Apellido',
    });
    expect(res.ok).toBe(true);
  });

  it('nombre / apellido solo espacios: ok:false', () => {
    const res = parseBootstrapAdminConfig({
      BOOTSTRAP_ADMIN_EMAIL: 'admin@ejemplo.com',
      BOOTSTRAP_ADMIN_PASSWORD: 'password-valida-123',
      BOOTSTRAP_ADMIN_NOMBRE: '   ',
      BOOTSTRAP_ADMIN_APELLIDO: '   ',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors).toContain('BOOTSTRAP_ADMIN_NOMBRE vacío o espacios');
      expect(res.errors).toContain('BOOTSTRAP_ADMIN_APELLIDO vacío o espacios');
    }
  });

  it('normalización', () => {
    const res = parseBootstrapAdminConfig({
      BOOTSTRAP_ADMIN_EMAIL: '  Admin@Ejemplo.COM ',
      BOOTSTRAP_ADMIN_PASSWORD: '  password-valida-123 ',
      BOOTSTRAP_ADMIN_NOMBRE: '  Juan ',
      BOOTSTRAP_ADMIN_APELLIDO: '  Perez ',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.config.email).toBe('admin@ejemplo.com');
      expect(res.config.nombre).toBe('Juan');
      expect(res.config.apellido).toBe('Perez');
      expect(res.config.password).toBe('  password-valida-123 '); // sin modificar
    }
  });

  it('varios errores a la vez', () => {
    const res = parseBootstrapAdminConfig({
      BOOTSTRAP_ADMIN_EMAIL: 'invalid',
      BOOTSTRAP_ADMIN_PASSWORD: 'short',
      BOOTSTRAP_ADMIN_NOMBRE: '   ',
      BOOTSTRAP_ADMIN_APELLIDO: '',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.length).toBeGreaterThan(3);
    }
  });

  it('pureza: no lee process.env', () => {
    // Even if process.env has values, it shouldn't be read. We just pass an empty object.
    process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@ejemplo.com';
    const res = parseBootstrapAdminConfig({});
    expect(res.ok).toBe(false);
    delete process.env.BOOTSTRAP_ADMIN_EMAIL;
  });
});
