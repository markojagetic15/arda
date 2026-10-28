import { beforeEach, describe, expect, it } from 'vitest';

import { Session } from '../../../domain/session/session.model.js';
import { IncorrectPasswordError } from '../../../domain/user/user.errors.js';
import { User } from '../../../domain/user/user.model.js';
import type { ConfigService } from '@nestjs/config';

import {
  createTestAuthConfig,
  FakeConfigService,
  FakeMailer,
  FakePasswordHasher,
} from '../../../../test/fakes/fake-services.js';
import { InMemorySessionRepository } from '../../../../test/fakes/in-memory-session.repository.js';
import { InMemoryUserRepository } from '../../../../test/fakes/in-memory-user.repository.js';
import { ChangePasswordUseCase } from './change-password.use-case.js';

describe('ChangePasswordUseCase', () => {
  let users: InMemoryUserRepository;
  let sessions: InMemorySessionRepository;
  let changePassword: ChangePasswordUseCase;

  const session = (id: string, hash: string) =>
    Session.create({
      id,
      userId: 'user-1',
      refreshTokenHash: hash,
      expiresAt: new Date(Date.now() + 60_000),
    });

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    sessions = new InMemorySessionRepository();
    changePassword = new ChangePasswordUseCase(
      users,
      sessions,
      new FakePasswordHasher(),
      new FakeMailer(),
      new FakeConfigService(createTestAuthConfig()) as unknown as ConfigService,
    );
    await users.save(
      User.create({
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Jane',
        passwordHash: 'hashed:old-password',
      }),
    );
    await sessions.save(session('s-current', 'current'));
    await sessions.save(session('s-other', 'other'));
  });

  it('changes the password and signs out other sessions only', async () => {
    await changePassword.execute({
      userId: 'user-1',
      currentPassword: 'old-password',
      newPassword: 'new-password',
      keepRefreshTokenHash: 'current',
    });

    const user = await users.findById('user-1');
    expect(user?.passwordHash).toBe('hashed:new-password');
    expect((await sessions.findByRefreshTokenHash('current'))?.isActive()).toBe(
      true,
    );
    expect((await sessions.findByRefreshTokenHash('other'))?.isActive()).toBe(
      false,
    );
  });

  it('rejects a wrong current password', async () => {
    await expect(
      changePassword.execute({
        userId: 'user-1',
        currentPassword: 'nope',
        newPassword: 'new-password',
      }),
    ).rejects.toBeInstanceOf(IncorrectPasswordError);
    expect((await users.findById('user-1'))?.passwordHash).toBe(
      'hashed:old-password',
    );
  });
});
