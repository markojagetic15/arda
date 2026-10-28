import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';

import { InvalidSessionError } from '../../../domain/session/session.errors.js';
import { User } from '../../../domain/user/user.model.js';
import {
  createTestAuthConfig,
  FakeConfigService,
  FakeTokenService,
} from '../../../../test/fakes/fake-services.js';
import { InMemorySessionRepository } from '../../../../test/fakes/in-memory-session.repository.js';
import { InMemoryUserRepository } from '../../../../test/fakes/in-memory-user.repository.js';
import { IssueSessionUseCase } from './issue-session.use-case.js';
import { RefreshSessionUseCase } from './refresh-session.use-case.js';

describe('RefreshSessionUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let sessionRepository: InMemorySessionRepository;
  let useCase: RefreshSessionUseCase;
  let configService: ConfigService;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    sessionRepository = new InMemorySessionRepository();
    configService = new FakeConfigService(
      createTestAuthConfig(),
    ) as unknown as ConfigService;
    useCase = new RefreshSessionUseCase(
      userRepository,
      sessionRepository,
      new FakeTokenService(),
      configService,
    );

    await userRepository.save(
      User.create({
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Jane',
        passwordHash: 'x',
      }),
    );
  });

  async function issueInitialSession() {
    const issueSession = new IssueSessionUseCase(
      sessionRepository,
      new FakeTokenService(),
      configService,
    );
    const user = await userRepository.findById('user-1');
    return issueSession.execute({ user: user! });
  }

  it('rotates the refresh token and returns a new access token', async () => {
    const initial = await issueInitialSession();

    const refreshed = await useCase.execute({
      refreshToken: initial.refreshToken,
    });

    expect(refreshed.user.id).toBe('user-1');
    expect(refreshed.refreshToken).not.toBe(initial.refreshToken);
    expect(refreshed.accessToken).toContain('user-1');
  });

  it('rejects re-use of a rotated-out refresh token', async () => {
    const initial = await issueInitialSession();
    await useCase.execute({ refreshToken: initial.refreshToken });

    await expect(
      useCase.execute({ refreshToken: initial.refreshToken }),
    ).rejects.toThrow(InvalidSessionError);
  });

  it('rejects an unknown refresh token', async () => {
    await expect(
      useCase.execute({ refreshToken: 'not-a-real-token' }),
    ).rejects.toThrow(InvalidSessionError);
  });
});
