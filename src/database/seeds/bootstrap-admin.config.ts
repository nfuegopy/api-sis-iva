export interface BootstrapAdminConfig {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

export type BootstrapConfigResult =
  | { ok: true; config: BootstrapAdminConfig }
  | { ok: false; errors: string[] };

export const BOOTSTRAP_PASSWORD_MIN_LENGTH = 12;

export function parseBootstrapAdminConfig(
  env: Record<string, string | undefined>,
): BootstrapConfigResult {
  const errors: string[] = [];

  // Check presence
  if (!env.BOOTSTRAP_ADMIN_EMAIL) {
    errors.push('Falta BOOTSTRAP_ADMIN_EMAIL');
  }
  if (!env.BOOTSTRAP_ADMIN_PASSWORD) {
    errors.push('Falta BOOTSTRAP_ADMIN_PASSWORD');
  }
  if (!env.BOOTSTRAP_ADMIN_NOMBRE) {
    errors.push('Falta BOOTSTRAP_ADMIN_NOMBRE');
  }
  if (!env.BOOTSTRAP_ADMIN_APELLIDO) {
    errors.push('Falta BOOTSTRAP_ADMIN_APELLIDO');
  }

  // If missing fields, we don't proceed to format validation to avoid undefined errors
  // but we can just initialize them to empty string if undefined to accumulate all errors
  const emailRaw = env.BOOTSTRAP_ADMIN_EMAIL || '';
  const passwordRaw = env.BOOTSTRAP_ADMIN_PASSWORD || '';
  const nombreRaw = env.BOOTSTRAP_ADMIN_NOMBRE || '';
  const apellidoRaw = env.BOOTSTRAP_ADMIN_APELLIDO || '';

  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw; // sin trim, sin modificar
  const nombre = nombreRaw.trim();
  const apellido = apellidoRaw.trim();

  if (emailRaw && email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Formato inválido en BOOTSTRAP_ADMIN_EMAIL');
    }
  } else if (emailRaw) {
      errors.push('Falta BOOTSTRAP_ADMIN_EMAIL'); // si es puros espacios
  }

  if (passwordRaw && password.length < BOOTSTRAP_PASSWORD_MIN_LENGTH) {
    errors.push('La contraseña no cumple con la longitud mínima');
  }

  if (nombreRaw && !nombre) {
    errors.push('BOOTSTRAP_ADMIN_NOMBRE vacío o espacios');
  }
  
  if (apellidoRaw && !apellido) {
    errors.push('BOOTSTRAP_ADMIN_APELLIDO vacío o espacios');
  }

  if (errors.length > 0) {
    // deduplicate exact errors just in case
    return { ok: false, errors: Array.from(new Set(errors)) };
  }

  return {
    ok: true,
    config: {
      email,
      password,
      nombre,
      apellido,
    },
  };
}
