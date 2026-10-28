import { Invitation } from '../../src/domain/access/invitation.model.js';
import { InvitationRepository } from '../../src/domain/access/invitation.repository.js';
import type { ScopeType } from '../../src/domain/access/role.js';

export class InMemoryInvitationRepository extends InvitationRepository {
  readonly invitations = new Map<string, Invitation>();

  async findById(id: string): Promise<Invitation | null> {
    return this.invitations.get(id) ?? null;
  }

  async findByTokenHash(hash: string): Promise<Invitation | null> {
    return (
      [...this.invitations.values()].find(
        (i) => i.toProps().tokenHash === hash,
      ) ?? null
    );
  }

  async findForScope(
    scopeType: ScopeType,
    scopeId: string,
  ): Promise<Invitation[]> {
    return [...this.invitations.values()].filter(
      (i) => i.scopeType === scopeType && i.scopeId === scopeId,
    );
  }

  async findPending(
    scopeType: ScopeType,
    scopeId: string,
    email: string,
  ): Promise<Invitation | null> {
    return (
      [...this.invitations.values()].find(
        (i) =>
          i.scopeType === scopeType &&
          i.scopeId === scopeId &&
          i.email === email,
      ) ?? null
    );
  }

  async save(invitation: Invitation): Promise<void> {
    this.invitations.set(invitation.id, invitation);
  }

  async delete(id: string): Promise<void> {
    this.invitations.delete(id);
  }
}
