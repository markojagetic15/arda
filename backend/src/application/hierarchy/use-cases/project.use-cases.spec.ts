import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryDocumentSnapshotRepository } from '../../../../test/fakes/in-memory-document-snapshot.repository.js';
import { InMemoryMembershipRepository } from '../../../../test/fakes/in-memory-membership.repository.js';
import { InMemoryPageRepository } from '../../../../test/fakes/in-memory-page.repository.js';
import { InMemoryProjectRepository } from '../../../../test/fakes/in-memory-project.repository.js';
import { InMemorySpaceRepository } from '../../../../test/fakes/in-memory-space.repository.js';
import { SpaceNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { PageType } from '../../../domain/hierarchy/page-type.js';
import { Space } from '../../../domain/hierarchy/space.model.js';
import { AccessService } from '../../access/access.service.js';
import { CreateProjectUseCase } from './create-project.use-case.js';
import { DuplicateProjectUseCase } from './duplicate-project.use-case.js';
import { MoveProjectUseCase } from './move-project.use-case.js';

describe('Project use cases', () => {
  let spaceRepository: InMemorySpaceRepository;
  let projectRepository: InMemoryProjectRepository;
  let pageRepository: InMemoryPageRepository;
  let createProject: CreateProjectUseCase;
  let moveProject: MoveProjectUseCase;
  let duplicateProject: DuplicateProjectUseCase;
  const ownerId = 'owner-1';

  beforeEach(async () => {
    spaceRepository = new InMemorySpaceRepository();
    projectRepository = new InMemoryProjectRepository(spaceRepository);
    pageRepository = new InMemoryPageRepository(projectRepository);
    const access = new AccessService(
      spaceRepository,
      projectRepository,
      pageRepository,
      new InMemoryMembershipRepository(),
    );
    createProject = new CreateProjectUseCase(
      spaceRepository,
      projectRepository,
      pageRepository,
      access,
    );
    moveProject = new MoveProjectUseCase(
      spaceRepository,
      projectRepository,
      access,
    );
    duplicateProject = new DuplicateProjectUseCase(
      projectRepository,
      pageRepository,
      new InMemoryDocumentSnapshotRepository(),
      access,
    );
  });

  async function makeSpace(name: string) {
    const space = Space.create({
      id: `space-${name}`,
      name,
      ownerId,
      position: 1,
    });
    await spaceRepository.save(space);
    return space;
  }

  it('creates a project with the three default collaborative pages', async () => {
    const space = await makeSpace('Engineering');

    const { project, pages } = await createProject.execute({
      ownerId,
      spaceId: space.id,
      name: 'Launch',
    });

    expect(project.spaceId).toBe(space.id);
    expect(pages).toHaveLength(3);
    expect(pages.map((page) => page.type).sort()).toEqual(
      [PageType.CANVAS, PageType.DOCUMENT, PageType.KANBAN].sort(),
    );
    expect(
      pages.every(
        (page) => page.projectId === project.id && page.parentId === null,
      ),
    ).toBe(true);
  });

  it('rejects creating a project in a space the user does not own', async () => {
    const space = Space.create({
      id: 'other-space',
      name: 'Not mine',
      ownerId: 'someone-else',
      position: 1,
    });
    await spaceRepository.save(space);

    await expect(
      createProject.execute({ ownerId, spaceId: space.id, name: 'Launch' }),
    ).rejects.toThrow(SpaceNotFoundError);
  });

  it('moves a project to a different space without touching its pages', async () => {
    const spaceA = await makeSpace('A');
    const spaceB = await makeSpace('B');
    const { project, pages } = await createProject.execute({
      ownerId,
      spaceId: spaceA.id,
      name: 'Launch',
    });

    const moved = await moveProject.execute({
      ownerId,
      projectId: project.id,
      targetSpaceId: spaceB.id,
      index: 0,
    });

    expect(moved.spaceId).toBe(spaceB.id);
    const stillOwnedPages = await pageRepository.findAllForProjects([
      project.id,
    ]);
    expect(stillOwnedPages.map((page) => page.id).sort()).toEqual(
      pages.map((page) => page.id).sort(),
    );
  });

  it('duplicates a project and deep-clones its entire page forest', async () => {
    const space = await makeSpace('A');
    const { project } = await createProject.execute({
      ownerId,
      spaceId: space.id,
      name: 'Launch',
    });

    const { project: clone, pages: clonedPages } =
      await duplicateProject.execute({
        ownerId,
        projectId: project.id,
      });

    expect(clone.id).not.toBe(project.id);
    expect(clone.name).toBe('Launch (copy)');
    expect(clone.spaceId).toBe(space.id);
    expect(clonedPages).toHaveLength(3);
    expect(
      clonedPages.every(
        (page) => page.projectId === clone.id && page.parentId === null,
      ),
    ).toBe(true);

    // originals are untouched
    const originalPages = await pageRepository.findAllForProjects([project.id]);
    expect(originalPages).toHaveLength(3);
  });
});
