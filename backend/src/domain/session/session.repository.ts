import type { Session } from './session.model.js';

export abstract class SessionRepository {
  abstract findByRefreshTokenHash(hash: string): Promise<Session | null>;
  abstract save(session: Session): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
  /** Revokes every active session of the user except the one with `keepRefreshTokenHash`. */
  abstract revokeAllForUserExcept(
    userId: string,
    keepRefreshTokenHash: string | null,
  ): Promise<void>;
}
