/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionesContablesService } from './asignaciones-contables.service';
import { AsignacionesContablesController } from './asignaciones-contables.controller';
import { AsignacionContable } from './entities/asignacion-contable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AsignacionContable])],
  controllers: [AsignacionesContablesController],
  providers: [AsignacionesContablesService],
  exports: [AsignacionesContablesService],
})
export class AsignacionesContablesModule {}
