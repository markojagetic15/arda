import { Injectable } from '@nestjs/common';

import { AccessDeniedError } from '../../domain/access/access.errors.js';
import { MembershipRepository } from '../../domain/access/membership.repository.js';
import {
  hasRole,
  maxRole,
  type Role,
  type Scope,
} from '../../domain/access/role.js';
import type { Page } from '../../domain/hierarchy/page.model.js';
import { PageRepository } from '../../domain/hierarchy/page.repository.js';
import type { Project } from '../../domain/hierarchy/project.model.js';
import { ProjectRepository } from '../../domain/hierarchy/project.repository.js';
import type { Space } from '../../domain/hierarchy/space.model.js';
import { SpaceRepository } from '../../domain/hierarchy/space.repository.js';

export interface PageContext {
  page: Page;
  /** Parent pages, nearest first. */
  ancestors: Page[];
  project: Project;
  space: Space;
}

export interface AccessibleTree {
  spaces: Space[];
  projects: Project[];
  pages: Page[];
  roles: Map<string, Role>;
}

/**
 * Decides who may do what. A user's role on a node is the strongest of:
 * owning the node's space (always `full`) and any membership on the node or
 * one of its ancestors - access flows down the tree, like Notion.
 *
 * The `*For` lookups return the entity when the user has at least `min`,
 * `null` when they have no access at all (callers report "not found", so
 * nothing leaks), and throw AccessDeniedError when they can see the node but
 * their role is too weak.
 */
@Injectable()
export class AccessService {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly pageRepository: PageRepository,
    private readonly membershipRepository: MembershipRepository,
  ) {}

  async spaceFor(
    userId: string,
    spaceId: string,
    min: Role,
  ): Promise<Space | null> {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) return null;
    const role = await this.roleOnChain(userId, space, [
      { type: 'space', id: space.id },
    ]);
    return this.check(space, role, min);
  }

  async projectFor(
    userId: string,
    projectId: string,
    min: Role,
  ): Promise<Project | null> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) return null;
    const space = await this.spaceRepository.findById(project.spaceId);
    if (!space) return null;
    const role = await this.roleOnChain(userId, space, [
      { type: 'project', id: project.id },
      { type: 'space', id: space.id },
    ]);
    return this.check(project, role, min);
  }

  async pageFor(
    userId: string,
    pageId: string,
    min: Role,
  ): Promise<Page | null> {
    const context = await this.pageContext(pageId);
    if (!context) return null;
    return this.check(
      context.page,
      await this.roleForPageContext(userId, context),
      min,
    );
  }

  async roleForPage(userId: string, pageId: string): Promise<Role | null> {
    const context = await this.pageContext(pageId);
    return context ? this.roleForPageContext(userId, context) : null;
  }

  async roleForScope(userId: string, scope: Scope): Promise<Role | null> {
    const resolved = await this.scopeChain(scope);
    return resolved
      ? this.roleOnChain(userId, resolved.space, resolved.chain)
      : null;
  }

  /** The node and every ancestor scope, nearest first (used for inherited sharing). */
  async scopeChain(
    scope: Scope,
  ): Promise<{ chain: Scope[]; space: Space } | null> {
    if (scope.type === 'space') {
      const space = await this.spaceRepository.findById(scope.id);
      return space ? { chain: [scope], space } : null;
    }
    if (scope.type === 'project') {
      const project = await this.projectRepository.findById(scope.id);
      const space = project
        ? await this.spaceRepository.findById(project.spaceId)
        : null;
      return project && space
        ? { chain: [scope, { type: 'space', id: space.id }], space }
        : null;
    }
    const context = await this.pageContext(scope.id);
    return context
      ? { chain: this.chainOf(context), space: context.space }
      : null;
  }

  async pageContext(pageId: string): Promise<PageContext | null> {
    const page = await this.pageRepository.findById(pageId);
    if (!page) return null;
    const ancestors: Page[] = [];
    let parentId = page.parentId;
    while (parentId) {
      const parent = await this.pageRepository.findById(parentId);
      if (!parent) break;
      ancestors.push(parent);
      parentId = parent.parentId;
    }
    const project = await this.projectRepository.findById(page.projectId);
    const space = project
      ? await this.spaceRepository.findById(project.spaceId)
      : null;
    return project && space ? { page, ancestors, project, space } : null;
  }

  /** Every space, project and page the user can see, with their role on each. */
  async accessibleTree(userId: string): Promise<AccessibleTree> {
    const owned = await this.spaceRepository.findAllForOwner(userId);
    const memberships = await this.membershipRepository.findForUser(userId);
    const direct = new Map(
      memberships.map((m) => [`${m.scopeType}:${m.scopeId}`, m.role]),
    );
    const directIds = (type: Scope['type']) =>
      memberships.filter((m) => m.scopeType === type).map((m) => m.scopeId);

    const sharedPages = await this.pageRepository.findByIds(directIds('page'));
    const spaceIds = new Set([
      ...owned.map((s) => s.id),
      ...directIds('space'),
    ]);
    const projects = new Map(
      (await this.projectRepository.findAllForSpaces([...spaceIds])).map(
        (p) => [p.id, p],
      ),
    );
    const extraProjectIds = [
      ...directIds('project'),
      ...sharedPages.map((page) => page.projectId),
    ].filter((id) => !projects.has(id));
    for (const project of await this.projectRepository.findByIds(
      extraProjectIds,
    )) {
      projects.set(project.id, project);
    }

    const spaces = new Map(owned.map((space) => [space.id, space]));
    const missingSpaceIds = [
      ...new Set([
        ...spaceIds,
        ...[...projects.values()].map((p) => p.spaceId),
      ]),
    ].filter((id) => !spaces.has(id));
    for (const space of await this.spaceRepository.findByIds(missingSpaceIds)) {
      spaces.set(space.id, space);
    }
    const pages = await this.pageRepository.findAllForProjects([
      ...projects.keys(),
    ]);
    const pagesById = new Map(pages.map((page) => [page.id, page]));

    const roles = new Map<string, Role>();
    const spaceRole = (space: Space): Role | null =>
      space.ownerId === userId
        ? 'full'
        : (direct.get(`space:${space.id}`) ?? null);
    const projectRole = (project: Project): Role | null => {
      const space = spaces.get(project.spaceId);
      return maxRole(
        space ? spaceRole(space) : null,
        direct.get(`project:${project.id}`),
      );
    };
    const pageRoles = new Map<string, Role | null>();
    const pageRole = (page: Page): Role | null => {
      if (pageRoles.has(page.id)) return pageRoles.get(page.id)!;
      const parent = page.parentId ? pagesById.get(page.parentId) : undefined;
      const project = projects.get(page.projectId);
      const inherited = parent
        ? pageRole(parent)
        : project
          ? projectRole(project)
          : null;
      const role = maxRole(inherited, direct.get(`page:${page.id}`));
      pageRoles.set(page.id, role);
      return role;
    };

    const keep = <T extends { id: string }>(
      items: T[],
      roleOf: (item: T) => Role | null,
    ) =>
      items.filter((item) => {
        const role = roleOf(item);
        if (role) roles.set(item.id, role);
        return Boolean(role);
      });

    return {
      spaces: keep([...spaces.values()], spaceRole),
      projects: keep([...projects.values()], projectRole),
      pages: keep(pages, pageRole),
      roles,
    };
  }

  private chainOf(context: PageContext): Scope[] {
    return [
      { type: 'page', id: context.page.id },
      ...context.ancestors.map((page) => ({
        type: 'page' as const,
        id: page.id,
      })),
      { type: 'project', id: context.project.id },
      { type: 'space', id: context.space.id },
    ];
  }

  private roleForPageContext(
    userId: string,
    context: PageContext,
  ): Promise<Role | null> {
    return this.roleOnChain(userId, context.space, this.chainOf(context));
  }

  private async roleOnChain(
    userId: string,
    space: Space,
    chain: Scope[],
  ): Promise<Role | null> {
    if (space.ownerId === userId) return 'full';
    const memberships = await this.membershipRepository.findForUserOnScopes(
      userId,
      chain,
    );
    return maxRole(...memberships.map((membership) => membership.role));
  }

  private check<T>(entity: T, role: Role | null, min: Role): T | null {
    if (!role) return null;
    if (!hasRole(role, min)) throw new AccessDeniedError();
    return entity;
  }
}
