import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AccessDeniedError,
  InvalidShareError,
  InvitationNotFoundError,
} from '../../domain/access/access.errors.js';
import { Invitation } from '../../domain/access/invitation.model.js';
import { InvitationRepository } from '../../domain/access/invitation.repository.js';
import { Membership } from '../../domain/access/membership.model.js';
import { MembershipRepository } from '../../domain/access/membership.repository.js';
import {
  hasRole,
  maxRole,
  type Role,
  type Scope,
} from '../../domain/access/role.js';
import {
  PageNotFoundError,
  ProjectNotFoundError,
  SpaceNotFoundError,
} from '../../domain/hierarchy/hierarchy.errors.js';
import { PageRepository } from '../../domain/hierarchy/page.repository.js';
import { ProjectRepository } from '../../domain/hierarchy/project.repository.js';
import { SpaceRepository } from '../../domain/hierarchy/space.repository.js';
import {
  generateOpaqueToken,
  hashOpaqueToken,
} from '../../domain/shared/crypto.js';
import { UserRepository } from '../../domain/user/user.repository.js';
import { Mailer } from '../auth/ports/mailer.js';
import { emails } from '../notifications/emails.js';
import { AccessService } from './access.service.js';

const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ScopeSummary extends Scope {
  label: string;
}

export interface SharingEntry {
  userId: string;
  name: string;
  email: string;
  role: Role;
  isOwner: boolean;
  /** Set when the access comes from an ancestor (e.g. the space), not this node. */
  inheritedFrom: ScopeSummary | null;
}

export interface SharingInfo {
  scope: ScopeSummary;
  myRole: Role;
  canManage: boolean;
  people: SharingEntry[];
  invitations: { id: string; email: string; role: Role; createdAt: Date }[];
}

function notFound(scope: Scope): Error {
  if (scope.type === 'space') return new SpaceNotFoundError();
  if (scope.type === 'project') return new ProjectNotFoundError();
  return new PageNotFoundError();
}

/**
 * Who has access to a space/project/page, and changing that: email invites,
 * accepting them, role changes and removal. Managing requires `full` access
 * on the node (space owners always have it).
 */
@Injectable()
export class SharingService {
  constructor(
    private readonly access: AccessService,
    private readonly memberships: MembershipRepository,
    private readonly invitations: InvitationRepository,
    private readonly users: UserRepository,
    private readonly spaces: SpaceRepository,
    private readonly projects: ProjectRepository,
    private readonly pages: PageRepository,
    private readonly mailer: Mailer,
    private readonly configService: ConfigService,
  ) {}

  async getSharing(userId: string, scope: Scope): Promise<SharingInfo> {
    const myRole = await this.requireRole(userId, scope, 'view');
    const resolved = (await this.access.scopeChain(scope))!;
    const owner = await this.users.findById(resolved.space.ownerId);
    const memberships = await this.memberships.findForScopes(resolved.chain);
    const users = new Map(
      (
        await this.users.findByIds([
          ...new Set(memberships.map((m) => m.userId)),
        ])
      ).map((u) => [u.id, u]),
    );
    const labels = new Map<string, ScopeSummary>();
    for (const link of resolved.chain)
      labels.set(link.id, await this.describe(link));

    // One row per person: their strongest grant, preferring this node's own
    // membership when it is at least as strong (it's the one editable here).
    const byUser = new Map<string, SharingEntry>();
    for (const link of resolved.chain) {
      for (const membership of memberships.filter(
        (m) => m.scopeId === link.id,
      )) {
        const user = users.get(membership.userId);
        if (!user || user.id === resolved.space.ownerId) continue;
        const current = byUser.get(user.id);
        if (current && hasRole(current.role, membership.role)) continue;
        byUser.set(user.id, {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: membership.role,
          isOwner: false,
          inheritedFrom: link.id === scope.id ? null : labels.get(link.id)!,
        });
      }
    }

    const canManage = hasRole(myRole, 'full');
    const people: SharingEntry[] = [
      ...(owner
        ? [
            {
              userId: owner.id,
              name: owner.name,
              email: owner.email,
              role: 'full' as const,
              isOwner: true,
              inheritedFrom:
                scope.type === 'space' ? null : labels.get(resolved.space.id)!,
            },
          ]
        : []),
      ...[...byUser.values()].sort((a, b) => a.name.localeCompare(b.name)),
    ];
    const invitations = canManage
      ? (await this.invitations.findForScope(scope.type, scope.id))
          .filter((invitation) => !invitation.isExpired())
          .map((invitation) => ({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            createdAt: invitation.createdAt,
          }))
      : [];

    return {
      scope: labels.get(scope.id)!,
      myRole,
      canManage,
      people,
      invitations,
    };
  }

  /**
   * Gives `email` access. People with a confirmed account get it right away
   * (and a heads-up email); everyone else gets an invitation link, which
   * proves they own the inbox before any access is granted.
   */
  async invite(
    userId: string,
    scope: Scope,
    input: { email: string; role: Role },
  ): Promise<{ status: 'added' | 'invited' }> {
    await this.requireRole(userId, scope, 'full');
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email))
      throw new InvalidShareError('Enter a valid email address');

    const resolved = (await this.access.scopeChain(scope))!;
    const inviter = (await this.users.findById(userId))!;
    const target = await this.users.findByEmail(email);
    const summary = await this.describe(scope);
    const frontendUrl = this.configService.getOrThrow<string>('frontendUrl');

    if (target && target.id === resolved.space.ownerId) {
      throw new InvalidShareError(
        `${target.name} owns this space and already has full access`,
      );
    }
    if (target && target.id === userId) {
      throw new InvalidShareError('You already have access');
    }

    if (target?.isEmailVerified) {
      await this.grant(scope, target.id, input.role, userId);
      const landing = await this.landingPage(scope);
      await this.mailer.send(
        emails.sharedWithYou({
          to: target.email,
          inviterName: inviter.name,
          scopeLabel: summary.label,
          scopeKind: scope.type,
          role: input.role,
          openUrl: `${frontendUrl}/workspace${landing ? `/${landing}` : ''}`,
        }),
      );
      return { status: 'added' };
    }

    const previous = await this.invitations.findPending(
      scope.type,
      scope.id,
      email,
    );
    if (previous) await this.invitations.delete(previous.id);
    const token = generateOpaqueToken();
    await this.invitations.save(
      Invitation.create({
        id: randomUUID(),
        scopeType: scope.type,
        scopeId: scope.id,
        email,
        role: input.role,
        tokenHash: hashOpaqueToken(token),
        invitedBy: userId,
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      }),
    );
    await this.mailer.send(
      emails.invitation({
        to: email,
        inviterName: inviter.name,
        scopeLabel: summary.label,
        scopeKind: scope.type,
        role: input.role,
        acceptUrl: `${frontendUrl}/invite/${token}`,
      }),
    );
    return { status: 'invited' };
  }

  /** Public preview for the invite page (before signing in). */
  async previewInvitation(token: string) {
    const invitation = await this.findValidInvitation(token);
    const inviter = await this.users.findById(invitation.invitedBy);
    const scope = await this.describe({
      type: invitation.scopeType,
      id: invitation.scopeId,
    });
    return {
      scope,
      email: invitation.email,
      role: invitation.role,
      inviterName: inviter?.name ?? 'Someone',
    };
  }

  async acceptInvitation(userId: string, token: string) {
    const invitation = await this.findValidInvitation(token);
    const scope: Scope = { type: invitation.scopeType, id: invitation.scopeId };
    const resolved = await this.access.scopeChain(scope);
    if (!resolved) throw new InvitationNotFoundError();

    if (resolved.space.ownerId !== userId) {
      await this.grant(scope, userId, invitation.role, invitation.invitedBy);
    }
    const user = await this.users.findById(userId);
    if (user && user.email === invitation.email && !user.isEmailVerified) {
      user.markEmailVerified();
      await this.users.save(user);
    }
    await this.invitations.delete(invitation.id);
    return {
      scope: await this.describe(scope),
      pageId: await this.landingPage(scope),
    };
  }

  async changeRole(
    userId: string,
    scope: Scope,
    memberId: string,
    role: Role,
  ): Promise<void> {
    await this.requireRole(userId, scope, 'full');
    const membership = await this.memberships.findOne(
      scope.type,
      scope.id,
      memberId,
    );
    if (!membership)
      throw new InvalidShareError(
        "This person's access comes from a parent - change it there",
      );
    membership.changeRole(role);
    await this.memberships.save(membership);
  }

  /** Removes someone's direct access. Anyone may remove themselves ("leave"). */
  async removeMember(
    userId: string,
    scope: Scope,
    memberId: string,
  ): Promise<void> {
    if (memberId !== userId) await this.requireRole(userId, scope, 'full');
    const membership = await this.memberships.findOne(
      scope.type,
      scope.id,
      memberId,
    );
    if (!membership)
      throw new InvalidShareError(
        "This person's access comes from a parent - change it there",
      );
    await this.memberships.delete(membership.id);
  }

  async revokeInvitation(userId: string, invitationId: string): Promise<void> {
    const invitation = await this.invitations.findById(invitationId);
    if (!invitation) throw new InvitationNotFoundError();
    await this.requireRole(
      userId,
      { type: invitation.scopeType, id: invitation.scopeId },
      'full',
    );
    await this.invitations.delete(invitation.id);
  }

  private async findValidInvitation(token: string): Promise<Invitation> {
    const invitation = await this.invitations.findByTokenHash(
      hashOpaqueToken(token),
    );
    if (!invitation || invitation.isExpired())
      throw new InvitationNotFoundError();
    return invitation;
  }

  private async requireRole(
    userId: string,
    scope: Scope,
    min: Role,
  ): Promise<Role> {
    const role = await this.access.roleForScope(userId, scope);
    if (!role) throw notFound(scope);
    if (!hasRole(role, min)) {
      throw new AccessDeniedError(
        min === 'full'
          ? 'Only people with full access can change sharing'
          : undefined,
      );
    }
    return role;
  }

  /** Adds or upgrades a membership; never downgrades an existing one. */
  private async grant(
    scope: Scope,
    userId: string,
    role: Role,
    invitedBy: string,
  ): Promise<void> {
    const existing = await this.memberships.findOne(
      scope.type,
      scope.id,
      userId,
    );
    if (existing) {
      existing.changeRole(maxRole(existing.role, role)!);
      await this.memberships.save(existing);
      return;
    }
    await this.memberships.save(
      Membership.create({
        id: randomUUID(),
        scopeType: scope.type,
        scopeId: scope.id,
        userId,
        role,
        invitedBy,
      }),
    );
  }

  private async describe(scope: Scope): Promise<ScopeSummary> {
    if (scope.type === 'space') {
      const space = await this.spaces.findById(scope.id);
      return { ...scope, label: space?.name ?? 'Deleted space' };
    }
    if (scope.type === 'project') {
      const project = await this.projects.findById(scope.id);
      return { ...scope, label: project?.name ?? 'Deleted project' };
    }
    const page = await this.pages.findById(scope.id);
    return { ...scope, label: page?.title ?? 'Deleted page' };
  }

  /** Where to send someone who was just given access: the page itself, or the first page inside. */
  private async landingPage(scope: Scope): Promise<string | null> {
    if (scope.type === 'page') return scope.id;
    const projectIds =
      scope.type === 'project'
        ? [scope.id]
        : (await this.projects.findSiblings(scope.id)).map(
            (project) => project.id,
          );
    for (const projectId of projectIds) {
      const [first] = await this.pages.findSiblings(projectId, null);
      if (first) return first.id;
    }
    return null;
  }
}
