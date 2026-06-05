/* eslint-disable prettier/prettier */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SuscripcionGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Busca contribuyente_id en body o query params
    const contribuyenteId =
      request.body?.contribuyente_id ??
      request.query?.contribuyente_id;

    if (!contribuyenteId) return true;

    // Bloqueado solo si está CANCELADO y no tiene trial vigente
    const [suscripcion] = await this.dataSource.query(
      `SELECT estado FROM suscripciones
       WHERE contribuyente_id = ?
         AND estado = 'CANCELADO'
         AND (es_trial = FALSE OR trial_hasta < CURDATE())
       LIMIT 1`,
      [Number(contribuyenteId)],
    );

    if (suscripcion) {
      throw new ForbiddenException(
        'La suscripción del contribuyente está CANCELADA. Contacte al administrador del sistema.',
      );
    }

    return true;
  }
}
