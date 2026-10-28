import { Injectable } from '@nestjs/common';

import { hashOpaqueToken } from '../../../domain/shared/crypto.js';
import { InvalidOrExpiredResetTokenError } from '../../../domain/user/user.errors.js';
import type { User } from '../../../domain/user/user.model.js';
import { UserRepository } from '../../../domain/user/user.repository.js';

@Injectable()
export class VerifyEmailUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: { token: string }): Promise<User> {
    const user = await this.userRepository.findByEmailVerificationTokenHash(
      hashOpaqueToken(input.token),
    );
    if (!user || !user.isEmailVerificationTokenValid()) {
      throw new InvalidOrExpiredResetTokenError(
        'This confirmation link is invalid or has expired',
      );
    }
    user.markEmailVerified();
    await this.userRepository.save(user);
    return user;
  }
}
