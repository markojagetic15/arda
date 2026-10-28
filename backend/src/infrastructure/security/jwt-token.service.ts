import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { AppConfig } from '../../infrastructure/config/configuration.js';
import {
  AccessTokenPayload,
  TokenService,
} from '../../application/auth/ports/token.service.js';

@Injectable()
export class JwtTokenService extends TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  signAccessToken(payload: AccessTokenPayload): string {
    const auth = this.configService.getOrThrow<AppConfig['auth']>('auth');
    return this.jwtService.sign(payload, {
      secret: auth.accessTokenSecret,
      expiresIn: auth.accessTokenTtl,
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const auth = this.configService.getOrThrow<AppConfig['auth']>('auth');
    try {
      return this.jwtService.verify<AccessTokenPayload>(token, {
        secret: auth.accessTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
