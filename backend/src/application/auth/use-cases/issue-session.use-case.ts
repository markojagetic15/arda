import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  generateOpaqueToken,
  hashOpaqueToken,
} from '../../../domain/shared/crypto.js';
import { Session } from '../../../domain/session/session.model.js';
import { SessionRepository } from '../../../domain/session/session.repository.js';
import type { User } from '../../../domain/user/user.model.js';
import type { AppConfig } from '../../../infrastructure/config/configuration.js';
import { TokenService } from '../ports/token.service.js';

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class IssueSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: {
    user: User;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<IssuedSession> {
    const auth = this.configService.getOrThrow<AppConfig['auth']>('auth');

    const refreshToken = generateOpaqueToken();
    const refreshTokenHash = hashOpaqueToken(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + auth.refreshTokenTtlMs);

    const session = Session.create({
      id: randomUUID(),
      userId: input.user.id,
      refreshTokenHash,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: refreshTokenExpiresAt,
    });
    await this.sessionRepository.save(session);

    const accessToken = this.tokenService.signAccessToken({
      sub: input.user.id,
      email: input.user.email,
    });

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }
}
