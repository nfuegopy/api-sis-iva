/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepo: Repository<PasswordResetToken>,
  ) {}

  // Ejecuta todos los días a las 3:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async limpiarTokensExpirados(): Promise<void> {
    const ahora = new Date();

    const { affected: rfAffected } = await this.refreshTokenRepo.delete({
      expira_en: LessThan(ahora),
    });

    const { affected: prtAffected } = await this.passwordResetTokenRepo.delete({
      expira_en: LessThan(ahora),
    });

    this.logger.log(
      `Limpieza de tokens: ${rfAffected} refresh tokens y ${prtAffected} password reset tokens eliminados.`,
    );
  }
}
