import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PasswordHasher } from '../../../domain/shared/ports/password-hasher.port.js';
import { SessionRepository } from '../../../domain/session/session.repository.js';
import {
  IncorrectPasswordError,
  UserNotFoundError,
} from '../../../domain/user/user.errors.js';
import { UserRepository } from '../../../domain/user/user.repository.js';
import { Mailer } from '../../auth/ports/mailer.js';
import { emails } from '../../notifications/emails.js';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Changes the password after re-checking the current one, then signs out
   * every other session. The caller's own session (identified by its
   * refresh token hash) stays signed in.
   */
  async execute(input: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    keepRefreshTokenHash?: string | null;
  }): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const matches = await this.passwordHasher.verify(
      input.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new IncorrectPasswordError();
    }

    user.changePassword(await this.passwordHasher.hash(input.newPassword));
    await this.userRepository.save(user);

    await this.sessionRepository.revokeAllForUserExcept(
      user.id,
      input.keepRefreshTokenHash ?? null,
    );

    const frontendUrl = this.configService.getOrThrow<string>('frontendUrl');
    await this.mailer.send(
      emails.passwordChanged(
        user.email,
        user.name,
        `${frontendUrl}/forgot-password`,
      ),
    );
  }
}
