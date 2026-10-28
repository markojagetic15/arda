import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { hashOpaqueToken } from '../../../domain/shared/crypto.js';
import { User } from '../../../domain/user/user.model.js';
import {
  createTestAuthConfig,
  FakeConfigService,
  FakeTokenService,
} from '../../../../test/fakes/fake-services.js';
import { InMemorySessionRepository } from '../../../../test/fakes/in-memory-session.repository.js';
import { InMemoryUserRepository } from '../../../../test/fakes/in-memory-user.repository.js';
import { IssueSessionUseCase } from './issue-session.use-case.js';
import { LogoutUseCase } from './logout.use-case.js';

describe('LogoutUseCase', () => {
  it('revokes the session matching the given refresh token', async () => {
    const userRepository = new InMemoryUserRepository();
    const sessionRepository = new InMemorySessionRepository();
    const configService = new FakeConfigService(
      createTestAuthConfig(),
    ) as unknown as ConfigService;
    const issueSession = new IssueSessionUseCase(
      sessionRepository,
      new FakeTokenService(),
      configService,
    );
    const logout = new LogoutUseCase(sessionRepository);

    const user = User.create({
      id: 'user-1',
      email: 'jane@example.com',
      name: 'Jane',
      passwordHash: 'x',
    });
    await userRepository.save(user);
    const session = await issueSession.execute({ user });

    await logout.execute({ refreshToken: session.refreshToken });

    const found = await sessionRepository.findByRefreshTokenHash(
      hashOpaqueToken(session.refreshToken),
    );
    expect(found?.isActive()).toBe(false);
  });

  it('is a no-op for an unknown refresh token', async () => {
    const sessionRepository = new InMemorySessionRepository();
    const logout = new LogoutUseCase(sessionRepository);
    await expect(
      logout.execute({ refreshToken: 'unknown' }),
    ).resolves.toBeUndefined();
  });
});
