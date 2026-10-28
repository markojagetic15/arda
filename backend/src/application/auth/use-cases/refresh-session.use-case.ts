import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  generateOpaqueToken,
  hashOpaqueToken,
} from '../../../domain/shared/crypto.js';
import { InvalidSessionError } from '../../../domain/session/session.errors.js';
import { SessionRepository } from '../../../domain/session/session.repository.js';
import { User } from '../../../domain/user/user.model.js';
import { UserRepository } from '../../../domain/user/user.repository.js';
import type { AppConfig } from '../../../infrastructure/config/configuration.js';
import { TokenService } from '../ports/token.service.js';

export interface RefreshSessionResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: {
    refreshToken: string;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<RefreshSessionResult> {
    const hash = hashOpaqueToken(input.refreshToken);
    const session = await this.sessionRepository.findByRefreshTokenHash(hash);
    if (!session || !session.isActive()) {
      throw new InvalidSessionError();
    }

    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      throw new InvalidSessionError();
    }

    const auth = this.configService.getOrThrow<AppConfig['auth']>('auth');
    const refreshToken = generateOpaqueToken();
    const refreshTokenExpiresAt = new Date(Date.now() + auth.refreshTokenTtlMs);
    session.rotate(hashOpaqueToken(refreshToken), refreshTokenExpiresAt);
    await this.sessionRepository.save(session);

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
    });

    return { user, accessToken, refreshToken, refreshTokenExpiresAt };
  }
}
