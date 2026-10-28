import { Injectable } from '@nestjs/common';

import { hashOpaqueToken } from '../../../domain/shared/crypto.js';
import { SessionRepository } from '../../../domain/session/session.repository.js';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(input: { refreshToken: string }): Promise<void> {
    const hash = hashOpaqueToken(input.refreshToken);
    const session = await this.sessionRepository.findByRefreshTokenHash(hash);
    if (!session) {
      return;
    }

    session.revoke();
    await this.sessionRepository.save(session);
  }
}
