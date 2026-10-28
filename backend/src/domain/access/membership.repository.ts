import type { Membership } from './membership.model.js';
import type { Scope, ScopeType } from './role.js';

export abstract class MembershipRepository {
  /** The user's memberships on any of the given scopes (an ancestor chain). */
  abstract findForUserOnScopes(
    userId: string,
    scopes: Scope[],
  ): Promise<Membership[]>;
  abstract findForUser(userId: string): Promise<Membership[]>;
  /** Everyone with direct access to any of the given scopes. */
  abstract findForScopes(scopes: Scope[]): Promise<Membership[]>;
  abstract findOne(
    scopeType: ScopeType,
    scopeId: string,
    userId: string,
  ): Promise<Membership | null>;
  abstract save(membership: Membership): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
