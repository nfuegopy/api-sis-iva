/* eslint-disable prettier/prettier */
import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseEmailProvider } from './providers/firebase-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { FirebaseModule } from '../../firebase/firebase.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Global()
@Module({
  imports: [
    FirebaseModule,
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        // Leemos la bandera de inseguridad del .env
        const ignoreTls = config.get<string>('MAIL_IGNORE_TLS') === 'true';

        return {
          transport: {
            host: config.get<string>('MAIL_HOST'),
            port: config.get<number>('MAIL_PORT'),
            secure: config.get<string>('MAIL_SECURE') === 'true', // true para puerto 465 (SSL), false para 587 (STARTTLS)
            auth: {
              user: config.get<string>('MAIL_USER'),
              pass: config.get<string>('MAIL_PASS'),
            },
            tls: {
              rejectUnauthorized: !ignoreTls,
            },
          },
          defaults: {
            from: config.get<string>('MAIL_FROM'),
          },
          // Opcional: Configuración de plantillas si deseas usar .hbs en el futuro
          template: {
            dir: process.cwd() + '/templates/',
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [NotificationsService, SmtpEmailProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
