import { Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

import {
  type EmailMessage,
  Mailer,
} from '../../application/auth/ports/mailer.js';
import type { AppConfig } from '../config/configuration.js';

/**
 * Sends through any SMTP server. Delivery failures are logged, not thrown:
 * an email that can't go out must never fail the request that triggered it
 * (sign-up, invite, ...).
 */
export class SmtpMailer extends Mailer {
  private readonly logger = new Logger(SmtpMailer.name);
  private readonly transporter: Transporter;

  constructor(private readonly config: AppConfig['mail']) {
    super();
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.from,
        replyTo: this.config.replyTo || undefined,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (error) {
      this.logger.error(
        `Could not send "${message.subject}" to ${message.to}`,
        error as Error,
      );
    }
  }
}
