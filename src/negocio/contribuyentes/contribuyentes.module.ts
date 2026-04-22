/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContribuyentesService } from './contribuyentes.service';
import { ContribuyentesController } from './contribuyentes.controller';
import { Contribuyente } from './entities/contribuyente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contribuyente])],
  controllers: [ContribuyentesController],
  providers: [ContribuyentesService],
  exports: [ContribuyentesService],
})
export class ContribuyentesModule {}
