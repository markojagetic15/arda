import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Mailer } from '../../application/auth/ports/mailer.js';
import type { AppConfig } from '../config/configuration.js';
import { ConsoleMailer } from './console-mailer.js';
import { SmtpMailer } from './smtp-mailer.js';

/** Provides `Mailer` everywhere: SMTP when SMTP_HOST and MAIL_FROM are set, console otherwise. */
@Global()
@Module({
  providers: [
    {
      provide: Mailer,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mail = configService.getOrThrow<AppConfig['mail']>('mail');
        if (mail.host && mail.from) return new SmtpMailer(mail);
        new Logger('MailModule').warn(
          'SMTP_HOST/MAIL_FROM not set - emails are only logged',
        );
        return new ConsoleMailer();
      },
    },
  ],
  exports: [Mailer],
})
export class MailModule {}
