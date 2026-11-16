/* eslint-disable prettier/prettier */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

export const ROL_ADMINISTRADOR = 'Administrador';

export function esAdministrador(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  const u = user as Record<string, unknown>;
  if (!u.rol || typeof u.rol !== 'object') return false;
  const r = u.rol as Record<string, unknown>;
  return typeof r.nombre === 'string' && r.nombre === ROL_ADMINISTRADOR;
}

@Injectable()
export class AdministradorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    if (!esAdministrador(request.user)) {
      throw new ForbiddenException('Acceso denegado: requiere rol Administrador.');
    }
    return true;
  }
}
