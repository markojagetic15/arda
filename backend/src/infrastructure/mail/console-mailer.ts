import { Injectable, Logger } from '@nestjs/common';

import {
  type EmailMessage,
  Mailer,
} from '../../application/auth/ports/mailer.js';

/** Used when no SMTP server is configured: logs each email (links included) instead of sending it. */
@Injectable()
export class ConsoleMailer extends Mailer {
  private readonly logger = new Logger(ConsoleMailer.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(
      `Email to ${message.to}: ${message.subject}\n${message.text}`,
    );
  }
}
