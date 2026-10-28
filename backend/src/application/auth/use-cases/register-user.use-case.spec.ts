import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';

import { EmailAlreadyInUseError } from '../../../domain/user/user.errors.js';
import {
  createTestAuthConfig,
  FakeConfigService,
  FakeMailer,
  FakePasswordHasher,
  FakeTokenService,
} from '../../../../test/fakes/fake-services.js';
import { InMemorySessionRepository } from '../../../../test/fakes/in-memory-session.repository.js';
import { InMemoryUserRepository } from '../../../../test/fakes/in-memory-user.repository.js';
import { IssueSessionUseCase } from './issue-session.use-case.js';
import { SendEmailVerificationUseCase } from '../../user/use-cases/send-email-verification.use-case.js';
import { RegisterUserUseCase } from './register-user.use-case.js';

describe('RegisterUserUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let useCase: RegisterUserUseCase;
  let mailer: FakeMailer;

  beforeEach(() => {
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
    mailer = new FakeMailer();
    useCase = new RegisterUserUseCase(
      userRepository,
      new FakePasswordHasher(),
      issueSession,
      new SendEmailVerificationUseCase(userRepository, mailer, configService),
    );
  });

  it('creates a user and issues a session', async () => {
    const result = await useCase.execute({
      email: 'Jane@Example.com',
      password: 'super-secret',
      name: 'Jane',
    });

    expect(result.user.email).toBe('jane@example.com');
    expect(result.accessToken).toContain(result.user.id);
    expect(result.refreshToken).toHaveLength(64);

    const stored = await userRepository.findByEmail('jane@example.com');
    expect(stored?.passwordHash).toBe('hashed:super-secret');
  });

  it('rejects a duplicate email', async () => {
    await useCase.execute({
      email: 'jane@example.com',
      password: 'super-secret',
      name: 'Jane',
    });

    await expect(
      useCase.execute({
        email: 'jane@example.com',
        password: 'another-pass',
        name: 'Jane 2',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError);
  });

  it('emails a link to confirm the address', async () => {
    await useCase.execute({
      email: 'new@example.com',
      password: 'password123',
      name: 'New',
    });
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].to).toBe('new@example.com');
    expect(mailer.lastLink()).toContain('/verify-email?token=');
    const user = await userRepository.findByEmail('new@example.com');
    expect(user?.isEmailVerified).toBe(false);
  });
});
