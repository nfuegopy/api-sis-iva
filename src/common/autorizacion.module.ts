/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { MenuRolGuard } from './guards/menu-rol.guard';
import { SuscripcionGuard } from './guards/suscripcion.guard';
import { AdministradorGuard } from './guards/administrador.guard';

// @Global() permite que los guards estén disponibles en toda la app
// sin necesidad de importar este módulo en cada feature module.
// Usan DataSource (global) para evitar el problema de repositorios
// no disponibles en módulos consumidores.
@Global()
@Module({
  providers: [MenuRolGuard, SuscripcionGuard, AdministradorGuard],
  exports: [MenuRolGuard, SuscripcionGuard, AdministradorGuard],
})
export class AutorizacionModule {}
