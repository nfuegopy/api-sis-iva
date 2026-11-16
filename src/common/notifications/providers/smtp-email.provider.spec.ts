import { SmtpEmailProvider } from './smtp-email.provider';
import { MailerService } from '@nestjs-modules/mailer';

describe('SmtpEmailProvider', () => {
  let provider: SmtpEmailProvider;
  let mockMailerService: Partial<MailerService>;

  beforeEach(() => {
    mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };
    provider = new SmtpEmailProvider(mockMailerService as MailerService);
  });

  it('no agrega BCC fijo al enviar un email', async () => {
    await provider.sendEmail('test@example.com', 'Subject', '<p>Test</p>');

    expect(mockMailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Subject',
        html: '<p>Test</p>',
      }),
    );

    const callArgs = (mockMailerService.sendMail as jest.Mock).mock.calls[0][0];
    expect(callArgs.bcc).toBeUndefined();
  });
});
