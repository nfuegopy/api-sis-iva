/* eslint-disable prettier/prettier */
import { SetMetadata } from '@nestjs/common';

export const PERMISO_KEY = 'permiso_menu';

// Uso: @RequierePermiso('/negocio/comprobantes')
// El valor debe coincidir con el campo `url` del registro en la tabla `menu`.
export const RequierePermiso = (menuUrl: string) =>
  SetMetadata(PERMISO_KEY, menuUrl);
