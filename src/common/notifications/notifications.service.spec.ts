import { NotificationsService } from './notifications.service';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { ConfigService } from '@nestjs/config';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockSmtpProvider: Partial<SmtpEmailProvider>;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockSmtpProvider = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };
    mockConfigService = {};
    service = new NotificationsService(
      mockConfigService as ConfigService,
      mockSmtpProvider as SmtpEmailProvider,
    );
  });

  it('el email de bienvenida NO contiene password', async () => {
    await service.sendBienvenidaEmail('test@example.com', 'Juan');

    expect(mockSmtpProvider.sendEmail).toHaveBeenCalled();
    const callArgs = (mockSmtpProvider.sendEmail as jest.Mock).mock.calls[0];
    
    // subject
    expect(callArgs[1]).not.toContain('credenciales');
    
    // html body
    const html = callArgs[2];
    expect(html).toContain('test@example.com');
    expect(html).not.toContain('Contraseña');
    expect(html).not.toContain('password'); // just in case
  });
});
