import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  generateOpaqueToken,
  hashOpaqueToken,
} from '../../../domain/shared/crypto.js';
import { UserRepository } from '../../../domain/user/user.repository.js';
import type { AppConfig } from '../../../infrastructure/config/configuration.js';
import { Mailer } from '../ports/mailer.js';

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailer: Mailer,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: { email: string }): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);
    // Always succeed silently — do not leak whether an email is registered.
    if (!user) {
      return;
    }

    const auth = this.configService.getOrThrow<AppConfig['auth']>('auth');
    const frontendUrl = this.configService.getOrThrow<string>('frontendUrl');

    const rawToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + auth.passwordResetTtlMs);
    user.setPasswordResetToken(hashOpaqueToken(rawToken), expiresAt);
    await this.userRepository.save(user);

    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    await this.mailer.sendPasswordResetEmail({ to: user.email, resetUrl });
  }
}
