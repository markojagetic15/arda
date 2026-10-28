import { describe, expect, it } from 'vitest';

import { User } from './user.model.js';

function makeUser() {
  return User.create({
    id: 'user-1',
    email: 'jane@example.com',
    name: 'Jane',
    passwordHash: 'hash-1',
  });
}

describe('User', () => {
  it('creates a user with no pending password reset token', () => {
    const user = makeUser();
    expect(user.email).toBe('jane@example.com');
    expect(user.isPasswordResetTokenValid()).toBe(false);
  });

  it('rename updates the name and bumps updatedAt', () => {
    const user = makeUser();
    const before = user.updatedAt.getTime();
    user.rename('Jane Doe');
    expect(user.name).toBe('Jane Doe');
    expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('changePassword replaces the hash and clears any reset token', () => {
    const user = makeUser();
    user.setPasswordResetToken('reset-hash', new Date(Date.now() + 60_000));
    expect(user.isPasswordResetTokenValid()).toBe(true);

    user.changePassword('hash-2');

    expect(user.passwordHash).toBe('hash-2');
    expect(user.isPasswordResetTokenValid()).toBe(false);
  });

  it('treats an expired reset token as invalid', () => {
    const user = makeUser();
    user.setPasswordResetToken('reset-hash', new Date(Date.now() - 1_000));
    expect(user.isPasswordResetTokenValid()).toBe(false);
  });

  it('treats a not-yet-expired reset token as valid', () => {
    const user = makeUser();
    user.setPasswordResetToken('reset-hash', new Date(Date.now() + 60_000));
    expect(user.isPasswordResetTokenValid()).toBe(true);
  });
});
