/* eslint-disable prettier/prettier */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { MenuRol } from 'src/referenciales/parametros/menu-rol/entities/menu-rol.entity';
import { PERMISO_KEY } from '../decorators/permiso.decorator';

// Mapeo HTTP method → columna del flag en menu_rol
const METHOD_FLAG: Record<string, keyof Pick<MenuRol, 'permitir_listar' | 'permitir_guardar' | 'permitir_editar' | 'permitir_eliminar'>> = {
  GET:    'permitir_listar',
  POST:   'permitir_guardar',
  PATCH:  'permitir_editar',
  PUT:    'permitir_editar',
  DELETE: 'permitir_eliminar',
};

@Injectable()
export class MenuRolGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // DataSource es global (registrado por TypeOrmModule.forRoot en AppModule),
    // por eso no necesita forFeature en cada módulo consumidor.
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lee el menuUrl del decorador @RequierePermiso puesto en el handler o en la clase
    const menuUrl =
      this.reflector.get<string>(PERMISO_KEY, context.getHandler()) ??
      this.reflector.get<string>(PERMISO_KEY, context.getClass());

    // Default deny: si el controller no declara @RequierePermiso, se bloquea
    if (!menuUrl) {
      throw new ForbiddenException('Acceso denegado: recurso sin configuración de permisos.');
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario?.rol?.id) {
      throw new ForbiddenException('Acceso denegado: sin rol asignado.');
    }

    const flag = METHOD_FLAG[request.method?.toUpperCase()];
    if (!flag) {
      throw new ForbiddenException('Método HTTP no permitido.');
    }

    // Consulta menu_rol cruzando rol_id del JWT + url del menú declarado
    const permiso = await this.dataSource.getRepository(MenuRol).findOne({
      where: {
        rol_id: usuario.rol.id,
        menu: { url: menuUrl },
      },
      relations: ['menu'],
    });

    if (!permiso || !permiso[flag]) {
      throw new ForbiddenException(
        `Sin permiso para ${request.method} en ${menuUrl}.`,
      );
    }

    return true;
  }
}
