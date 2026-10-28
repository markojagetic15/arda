import { describe, expect, it } from 'vitest';

import { Session } from './session.model.js';

function makeSession(expiresAt = new Date(Date.now() + 60_000)) {
  return Session.create({
    id: 'session-1',
    userId: 'user-1',
    refreshTokenHash: 'hash-1',
    expiresAt,
  });
}

describe('Session', () => {
  it('is active when not expired and not revoked', () => {
    const session = makeSession();
    expect(session.isActive()).toBe(true);
  });

  it('is inactive once expired', () => {
    const session = makeSession(new Date(Date.now() - 1_000));
    expect(session.isActive()).toBe(false);
  });

  it('is inactive once revoked', () => {
    const session = makeSession();
    session.revoke();
    expect(session.isActive()).toBe(false);
  });

  it('rotate replaces the hash and expiry', () => {
    const session = makeSession();
    const newExpiresAt = new Date(Date.now() + 120_000);
    session.rotate('hash-2', newExpiresAt);
    expect(session.refreshTokenHash).toBe('hash-2');
    expect(session.expiresAt).toEqual(newExpiresAt);
    expect(session.isActive()).toBe(true);
  });
});
