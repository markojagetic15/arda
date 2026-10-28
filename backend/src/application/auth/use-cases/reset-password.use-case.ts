import { Injectable } from '@nestjs/common';

import { hashOpaqueToken } from '../../../domain/shared/crypto.js';
import { PasswordHasher } from '../../../domain/shared/ports/password-hasher.port.js';
import { SessionRepository } from '../../../domain/session/session.repository.js';
import { InvalidOrExpiredResetTokenError } from '../../../domain/user/user.errors.js';
import { UserRepository } from '../../../domain/user/user.repository.js';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: { token: string; newPassword: string }): Promise<void> {
    const hash = hashOpaqueToken(input.token);
    const user = await this.userRepository.findByPasswordResetTokenHash(hash);
    if (!user || !user.isPasswordResetTokenValid()) {
      throw new InvalidOrExpiredResetTokenError();
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    user.changePassword(passwordHash);
    await this.userRepository.save(user);

    // Force re-authentication everywhere after a password reset.
    await this.sessionRepository.revokeAllForUser(user.id);
  }
}
