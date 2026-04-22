/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuotasPagosService } from './cuotas-pagos.service';
import { CuotasPagosController } from './cuotas-pagos.controller';
import { CuotaPago } from './entities/cuota-pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CuotaPago])],
  controllers: [CuotasPagosController],
  providers: [CuotasPagosService],
  exports: [CuotasPagosService],
})
export class CuotasPagosModule {}
