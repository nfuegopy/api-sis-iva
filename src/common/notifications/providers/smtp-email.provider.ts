import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider } from '../interfaces/email-provider.interface';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class SmtpEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: to,
        subject: subject,
        html: htmlBody,
        // El 'from' se toma por defecto del Module, pero se puede sobreescribir aquí si es necesario
      });

      this.logger.log(`📧 [SMTP] Correo enviado exitosamente a: ${to}`);
    } catch (error) {
      this.logger.error(
        `❌ [SMTP] Error enviando correo a ${to}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-lanzamos para que el servicio superior lo maneje
    }
  }
}
