import { Injectable, Logger } from '@nestjs/common';

import { Mailer } from '../../application/auth/ports/mailer.js';

/**
 * Stand-in until a real email provider is wired up — logs the reset link
 * instead of sending it.
 */
@Injectable()
export class ConsoleMailer extends Mailer {
  private readonly logger = new Logger(ConsoleMailer.name);

  async sendPasswordResetEmail(input: {
    to: string;
    resetUrl: string;
  }): Promise<void> {
    this.logger.log(`Password reset link for ${input.to}: ${input.resetUrl}`);
  }
}
