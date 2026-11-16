/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CuotasPagosService } from './cuotas-pagos.service';
import { CreateCuotaPagoDto } from './dto/create-cuota-pago.dto';
import { UpdateCuotaPagoDto } from './dto/update-cuota-pago.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MenuRolGuard } from '../../common/guards/menu-rol.guard';
import { RequierePermiso } from '../../common/decorators/permiso.decorator';
import { FiltroCuotasPagosDto } from './dto/filtro-cuotas-pagos.dto';

@Controller('cobranzas/cuotas-pagos')
@UseGuards(JwtAuthGuard, MenuRolGuard)
@RequierePermiso('/cobranzas/cuotas-pagos')
export class CuotasPagosController {
  constructor(private readonly cuotasPagosService: CuotasPagosService) {}

  @Post()
  create(@Body() createCuotaPagoDto: CreateCuotaPagoDto) {
    return this.cuotasPagosService.create(createCuotaPagoDto);
  }

  @Get()
  findAll(@Query() filtros: FiltroCuotasPagosDto) {
    return this.cuotasPagosService.findAll(
      filtros.page,
      filtros.limit,
      filtros.suscripcion_id,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cuotasPagosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCuotaPagoDto: UpdateCuotaPagoDto,
  ) {
    return this.cuotasPagosService.update(id, updateCuotaPagoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cuotasPagosService.remove(id);
  }
}
