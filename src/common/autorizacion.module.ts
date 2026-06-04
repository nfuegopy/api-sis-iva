/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { MenuRolGuard } from './guards/menu-rol.guard';

// @Global() permite que MenuRolGuard esté disponible en toda la app
// sin necesidad de importar este módulo en cada feature module.
// Se importa una sola vez en AppModule.
// Usa DataSource (global) en lugar de @InjectRepository para evitar
// el problema de repositorios no disponibles en módulos consumidores.
@Global()
@Module({
  providers: [MenuRolGuard],
  exports: [MenuRolGuard],
})
export class AutorizacionModule {}
