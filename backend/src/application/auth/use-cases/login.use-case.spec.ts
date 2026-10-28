import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';

import { InvalidCredentialsError } from '../../../domain/user/user.errors.js';
import { User } from '../../../domain/user/user.model.js';
import {
  createTestAuthConfig,
  FakeConfigService,
  FakePasswordHasher,
  FakeTokenService,
} from '../../../../test/fakes/fake-services.js';
import { InMemorySessionRepository } from '../../../../test/fakes/in-memory-session.repository.js';
import { InMemoryUserRepository } from '../../../../test/fakes/in-memory-user.repository.js';
import { IssueSessionUseCase } from './issue-session.use-case.js';
import { LoginUseCase } from './login.use-case.js';

describe('LoginUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    const sessionRepository = new InMemorySessionRepository();
    const configService = new FakeConfigService(
      createTestAuthConfig(),
    ) as unknown as ConfigService;
    const issueSession = new IssueSessionUseCase(
      sessionRepository,
      new FakeTokenService(),
      configService,
    );
    useCase = new LoginUseCase(
      userRepository,
      new FakePasswordHasher(),
      issueSession,
    );

    await userRepository.save(
      User.create({
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Jane',
        passwordHash: 'hashed:correct-password',
      }),
    );
  });

  it('logs in with correct credentials', async () => {
    const result = await useCase.execute({
      email: 'jane@example.com',
      password: 'correct-password',
    });
    expect(result.user.id).toBe('user-1');
    expect(result.accessToken).toContain('user-1');
  });

  it('rejects an unknown email', async () => {
    await expect(
      useCase.execute({ email: 'nobody@example.com', password: 'whatever' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects an incorrect password', async () => {
    await expect(
      useCase.execute({
        email: 'jane@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
