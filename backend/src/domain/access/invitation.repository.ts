import type { Invitation } from './invitation.model.js';
import type { ScopeType } from './role.js';

export abstract class InvitationRepository {
  abstract findById(id: string): Promise<Invitation | null>;
  abstract findByTokenHash(hash: string): Promise<Invitation | null>;
  abstract findForScope(
    scopeType: ScopeType,
    scopeId: string,
  ): Promise<Invitation[]>;
  abstract findPending(
    scopeType: ScopeType,
    scopeId: string,
    email: string,
  ): Promise<Invitation | null>;
  abstract save(invitation: Invitation): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
