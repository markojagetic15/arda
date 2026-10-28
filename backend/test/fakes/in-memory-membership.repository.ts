import { Membership } from '../../src/domain/access/membership.model.js';
import { MembershipRepository } from '../../src/domain/access/membership.repository.js';
import type { Scope, ScopeType } from '../../src/domain/access/role.js';

export class InMemoryMembershipRepository extends MembershipRepository {
  private readonly memberships = new Map<string, Membership>();

  async findForUserOnScopes(
    userId: string,
    scopes: Scope[],
  ): Promise<Membership[]> {
    return [...this.memberships.values()].filter(
      (m) =>
        m.userId === userId &&
        scopes.some((s) => s.type === m.scopeType && s.id === m.scopeId),
    );
  }

  async findForUser(userId: string): Promise<Membership[]> {
    return [...this.memberships.values()].filter((m) => m.userId === userId);
  }

  async findForScopes(scopes: Scope[]): Promise<Membership[]> {
    return [...this.memberships.values()].filter((m) =>
      scopes.some((s) => s.type === m.scopeType && s.id === m.scopeId),
    );
  }

  async findOne(
    scopeType: ScopeType,
    scopeId: string,
    userId: string,
  ): Promise<Membership | null> {
    return (
      [...this.memberships.values()].find(
        (m) =>
          m.scopeType === scopeType &&
          m.scopeId === scopeId &&
          m.userId === userId,
      ) ?? null
    );
  }

  async save(membership: Membership): Promise<void> {
    this.memberships.set(membership.id, membership);
  }

  async delete(id: string): Promise<void> {
    this.memberships.delete(id);
  }
}
