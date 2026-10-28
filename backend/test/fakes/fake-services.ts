import {
  AccessTokenPayload,
  TokenService,
} from '../../src/application/auth/ports/token.service.js';
import {
  type EmailMessage,
  Mailer,
} from '../../src/application/auth/ports/mailer.js';
import { PasswordHasher } from '../../src/domain/shared/ports/password-hasher.port.js';

export class FakePasswordHasher extends PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

export class FakeTokenService extends TokenService {
  signAccessToken(payload: AccessTokenPayload): string {
    return `access:${payload.sub}:${payload.email}`;
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const [, sub, email] = token.split(':');
    return { sub, email };
  }
}

export class FakeMailer extends Mailer {
  public readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }

  /** The first link in the most recent email's text part. */
  lastLink(): string {
    const text = this.sent.at(-1)?.text ?? '';
    return /https?:\/\/\S+/.exec(text)?.[0] ?? '';
  }
}

export class FakeConfigService {
  constructor(private readonly values: Record<string, unknown>) {}

  getOrThrow<T>(key: string): T {
    if (!(key in this.values)) {
      throw new Error(`Missing config key in FakeConfigService: ${key}`);
    }
    return this.values[key] as T;
  }
}

export function createTestAuthConfig() {
  return {
    auth: {
      accessTokenSecret: 'test-secret',
      accessTokenTtl: '15m',
      refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
      passwordResetTtlMs: 15 * 60 * 1000,
    },
    frontendUrl: 'http://localhost:5173',
  };
}
