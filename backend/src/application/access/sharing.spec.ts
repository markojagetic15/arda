import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createTestAuthConfig,
  FakeConfigService,
  FakeMailer,
} from '../../../test/fakes/fake-services.js';
import { InMemoryInvitationRepository } from '../../../test/fakes/in-memory-invitation.repository.js';
import { InMemoryMembershipRepository } from '../../../test/fakes/in-memory-membership.repository.js';
import { InMemoryPageRepository } from '../../../test/fakes/in-memory-page.repository.js';
import { InMemoryProjectRepository } from '../../../test/fakes/in-memory-project.repository.js';
import { InMemorySpaceRepository } from '../../../test/fakes/in-memory-space.repository.js';
import { InMemoryUserRepository } from '../../../test/fakes/in-memory-user.repository.js';
import {
  AccessDeniedError,
  InvitationNotFoundError,
} from '../../domain/access/access.errors.js';
import { Page } from '../../domain/hierarchy/page.model.js';
import { PageType } from '../../domain/hierarchy/page-type.js';
import { Project } from '../../domain/hierarchy/project.model.js';
import { Space } from '../../domain/hierarchy/space.model.js';
import { User } from '../../domain/user/user.model.js';
import { RenamePageUseCase } from '../hierarchy/use-cases/rename-page.use-case.js';
import { AccessService } from './access.service.js';
import { SharingService } from './sharing.service.js';

describe('Sharing and access', () => {
  let spaces: InMemorySpaceRepository;
  let projects: InMemoryProjectRepository;
  let pages: InMemoryPageRepository;
  let users: InMemoryUserRepository;
  let memberships: InMemoryMembershipRepository;
  let invitations: InMemoryInvitationRepository;
  let mailer: FakeMailer;
  let access: AccessService;
  let sharing: SharingService;

  const user = (id: string, email: string, verified = true) => {
    const created = User.create({ id, email, name: id, passwordHash: 'x' });
    if (verified) created.markEmailVerified();
    return created;
  };

  beforeEach(async () => {
    spaces = new InMemorySpaceRepository();
    projects = new InMemoryProjectRepository(spaces);
    pages = new InMemoryPageRepository(projects);
    users = new InMemoryUserRepository();
    memberships = new InMemoryMembershipRepository();
    invitations = new InMemoryInvitationRepository();
    mailer = new FakeMailer();
    access = new AccessService(spaces, projects, pages, memberships);
    sharing = new SharingService(
      access,
      memberships,
      invitations,
      users,
      spaces,
      projects,
      pages,
      mailer,
      new FakeConfigService(createTestAuthConfig()) as unknown as ConfigService,
    );

    await users.save(user('owner', 'owner@example.com'));
    await users.save(user('ana', 'ana@example.com'));
    await users.save(user('ivo', 'ivo@example.com', false));
    await spaces.save(
      Space.create({
        id: 'space',
        name: 'Team',
        ownerId: 'owner',
        position: 1,
      }),
    );
    await projects.save(
      Project.create({
        id: 'project',
        name: 'Launch',
        spaceId: 'space',
        position: 1,
      }),
    );
    await pages.save(
      Page.create({
        id: 'doc',
        title: 'Doc',
        type: PageType.DOCUMENT,
        projectId: 'project',
        parentId: null,
        position: 1,
      }),
    );
    await pages.save(
      Page.create({
        id: 'child',
        title: 'Child',
        projectId: 'project',
        parentId: 'doc',
        position: 1,
      }),
    );
    await pages.save(
      Page.create({
        id: 'other',
        title: 'Other',
        projectId: 'project',
        parentId: null,
        position: 2,
      }),
    );
  });

  it('gives the space owner full access everywhere and strangers none', async () => {
    expect(await access.roleForPage('owner', 'child')).toBe('full');
    expect(await access.roleForPage('ana', 'child')).toBeNull();
  });

  it('adds verified users directly and lets access flow down the tree', async () => {
    const result = await sharing.invite(
      'owner',
      { type: 'page', id: 'doc' },
      { email: 'Ana@Example.com', role: 'edit' },
    );

    expect(result.status).toBe('added');
    expect(mailer.sent.at(-1)?.subject).toContain('shared "Doc"');
    expect(await access.roleForPage('ana', 'doc')).toBe('edit');
    expect(await access.roleForPage('ana', 'child')).toBe('edit');
    expect(await access.roleForPage('ana', 'other')).toBeNull();

    const tree = await access.accessibleTree('ana');
    expect(tree.spaces).toHaveLength(0);
    expect(tree.pages.map((page) => page.id).sort()).toEqual(['child', 'doc']);
  });

  it('enforces the role: viewers can read but not edit', async () => {
    await sharing.invite(
      'owner',
      { type: 'project', id: 'project' },
      { email: 'ana@example.com', role: 'view' },
    );
    const rename = new RenamePageUseCase(pages, access);

    await expect(
      rename.execute({ ownerId: 'ana', pageId: 'doc', title: 'Hacked' }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    expect(await access.roleForPage('ana', 'other')).toBe('view');
  });

  it('sends unverified or unknown people an invitation link that grants access once', async () => {
    const result = await sharing.invite(
      'owner',
      { type: 'space', id: 'space' },
      { email: 'ivo@example.com', role: 'comment' },
    );
    expect(result.status).toBe('invited');
    expect(await access.roleForPage('ivo', 'doc')).toBeNull();

    const token = mailer.lastLink().split('/invite/')[1];
    const accepted = await sharing.acceptInvitation('ivo', token);

    expect(accepted.pageId).toBe('doc');
    expect(await access.roleForPage('ivo', 'child')).toBe('comment');
    expect((await users.findById('ivo'))?.isEmailVerified).toBe(true);
    await expect(sharing.acceptInvitation('ivo', token)).rejects.toBeInstanceOf(
      InvitationNotFoundError,
    );
  });

  it('only lets people with full access manage sharing', async () => {
    await sharing.invite(
      'owner',
      { type: 'space', id: 'space' },
      { email: 'ana@example.com', role: 'edit' },
    );

    await expect(
      sharing.invite(
        'ana',
        { type: 'space', id: 'space' },
        { email: 'x@example.com', role: 'view' },
      ),
    ).rejects.toBeInstanceOf(AccessDeniedError);

    const info = await sharing.getSharing('ana', { type: 'page', id: 'doc' });
    expect(info.canManage).toBe(false);
    expect(
      info.people.map((person) => [
        person.userId,
        person.role,
        person.inheritedFrom?.type,
      ]),
    ).toEqual([
      ['owner', 'full', 'space'],
      ['ana', 'edit', 'space'],
    ]);
  });
});
