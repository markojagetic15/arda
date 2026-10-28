import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';

import { hashOpaqueToken } from '../../../domain/shared/crypto.js';
import { InvalidOrExpiredResetTokenError } from '../../../domain/user/user.errors.js';
import { User } from '../../../domain/user/user.model.js';
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
import { RequestPasswordResetUseCase } from './request-password-reset.use-case.js';
import { ResetPasswordUseCase } from './reset-password.use-case.js';

describe('password reset flow', () => {
  let userRepository: InMemoryUserRepository;
  let sessionRepository: InMemorySessionRepository;
  let mailer: FakeMailer;
  let requestReset: RequestPasswordResetUseCase;
  let resetPassword: ResetPasswordUseCase;
  let configService: ConfigService;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    sessionRepository = new InMemorySessionRepository();
    mailer = new FakeMailer();
    configService = new FakeConfigService(
      createTestAuthConfig(),
    ) as unknown as ConfigService;

    requestReset = new RequestPasswordResetUseCase(
      userRepository,
      mailer,
      configService,
    );
    resetPassword = new ResetPasswordUseCase(
      userRepository,
      sessionRepository,
      new FakePasswordHasher(),
    );

    await userRepository.save(
      User.create({
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Jane',
        passwordHash: 'hashed:old-password',
      }),
    );
  });

  it('does nothing but still succeeds for an unknown email', async () => {
    await expect(
      requestReset.execute({ email: 'nobody@example.com' }),
    ).resolves.toBeUndefined();
    expect(mailer.sent).toHaveLength(0);
  });

  it('emails a reset link and allows completing the reset', async () => {
    await requestReset.execute({ email: 'jane@example.com' });
    expect(mailer.sent).toHaveLength(1);

    const resetUrl = new URL(mailer.sent[0].resetUrl);
    const token = resetUrl.searchParams.get('token')!;
    expect(token).toHaveLength(64);

    await resetPassword.execute({ token, newPassword: 'new-password' });

    const updated = await userRepository.findByEmail('jane@example.com');
    expect(updated?.passwordHash).toBe('hashed:new-password');
    expect(updated?.isPasswordResetTokenValid()).toBe(false);
  });

  it('revokes all sessions when the password is reset', async () => {
    const user = await userRepository.findByEmail('jane@example.com');
    const issueSession = new IssueSessionUseCase(
      sessionRepository,
      new FakeTokenService(),
      configService,
    );
    const session = await issueSession.execute({ user: user! });

    await requestReset.execute({ email: 'jane@example.com' });
    const token = new URL(mailer.sent[0].resetUrl).searchParams.get('token')!;
    await resetPassword.execute({ token, newPassword: 'new-password' });

    const revokedSession = await sessionRepository.findByRefreshTokenHash(
      hashOpaqueToken(session.refreshToken),
    );
    expect(revokedSession?.isActive()).toBe(false);
  });

  it('rejects an invalid token', async () => {
    await expect(
      resetPassword.execute({
        token: 'not-a-real-token',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(InvalidOrExpiredResetTokenError);
  });

  it('rejects an expired token', async () => {
    const user = await userRepository.findByEmail('jane@example.com');
    user!.setPasswordResetToken(
      hashOpaqueToken('raw-token'),
      new Date(Date.now() - 1_000),
    );
    await userRepository.save(user!);

    await expect(
      resetPassword.execute({
        token: 'raw-token',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(InvalidOrExpiredResetTokenError);
  });
});
