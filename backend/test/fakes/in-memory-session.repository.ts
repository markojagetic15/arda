import { Session } from '../../src/domain/session/session.model.js';
import { SessionRepository } from '../../src/domain/session/session.repository.js';

export class InMemorySessionRepository extends SessionRepository {
  private readonly sessions = new Map<string, Session>();

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.refreshTokenHash === hash) return session;
    }
    return null;
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) session.revoke();
    }
  }
}
