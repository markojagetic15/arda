import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  generateOpaqueToken,
  hashOpaqueToken,
} from '../../../domain/shared/crypto.js';
import type { User } from '../../../domain/user/user.model.js';
import { UserRepository } from '../../../domain/user/user.repository.js';
import { Mailer } from '../../auth/ports/mailer.js';
import { emails } from '../../notifications/emails.js';

const VERIFICATION_TTL_MS = 3 * 24 * 60 * 60 * 1000;

/** Emails a fresh "confirm your address" link (valid 3 days). No-op for verified users. */
@Injectable()
export class SendEmailVerificationUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailer: Mailer,
    private readonly configService: ConfigService,
  ) {}

  async execute(user: User): Promise<void> {
    if (user.isEmailVerified) return;
    const token = generateOpaqueToken();
    user.setEmailVerificationToken(
      hashOpaqueToken(token),
      new Date(Date.now() + VERIFICATION_TTL_MS),
    );
    await this.userRepository.save(user);
    const frontendUrl = this.configService.getOrThrow<string>('frontendUrl');
    await this.mailer.send(
      emails.verifyEmail(
        user.email,
        user.name,
        `${frontendUrl}/verify-email?token=${token}`,
      ),
    );
  }
}
