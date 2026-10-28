import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryPageRepository } from '../../../../test/fakes/in-memory-page.repository.js';
import { InMemoryProjectRepository } from '../../../../test/fakes/in-memory-project.repository.js';
import { InMemorySpaceRepository } from '../../../../test/fakes/in-memory-space.repository.js';
import { InvalidMoveError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Project } from '../../../domain/hierarchy/project.model.js';
import { Space } from '../../../domain/hierarchy/space.model.js';
import { CreatePageUseCase } from './create-page.use-case.js';
import { DuplicatePageUseCase } from './duplicate-page.use-case.js';
import { MovePageUseCase } from './move-page.use-case.js';

describe('Page use cases', () => {
  let spaceRepository: InMemorySpaceRepository;
  let projectRepository: InMemoryProjectRepository;
  let pageRepository: InMemoryPageRepository;
  let createPage: CreatePageUseCase;
  let movePage: MovePageUseCase;
  let duplicatePage: DuplicatePageUseCase;
  const ownerId = 'owner-1';
  let projectA: Project;
  let projectB: Project;

  beforeEach(async () => {
    spaceRepository = new InMemorySpaceRepository();
    projectRepository = new InMemoryProjectRepository(spaceRepository);
    pageRepository = new InMemoryPageRepository(projectRepository);
    createPage = new CreatePageUseCase(projectRepository, pageRepository);
    movePage = new MovePageUseCase(projectRepository, pageRepository);
    duplicatePage = new DuplicatePageUseCase(pageRepository);

    const space = Space.create({
      id: 'space-1',
      name: 'Space',
      ownerId,
      position: 1,
    });
    await spaceRepository.save(space);
    projectA = Project.create({
      id: 'project-a',
      name: 'A',
      spaceId: space.id,
      position: 1,
    });
    projectB = Project.create({
      id: 'project-b',
      name: 'B',
      spaceId: space.id,
      position: 2,
    });
    await projectRepository.saveMany([projectA, projectB]);
  });

  it('creates a root page when parentId names a project', async () => {
    const page = await createPage.execute({
      ownerId,
      parentId: projectA.id,
      title: 'Notes',
    });
    expect(page.projectId).toBe(projectA.id);
    expect(page.parentId).toBeNull();
  });

  it('creates a nested sub-page when parentId names a page', async () => {
    const root = await createPage.execute({
      ownerId,
      parentId: projectA.id,
      title: 'Root',
    });
    const child = await createPage.execute({
      ownerId,
      parentId: root.id,
      title: 'Child',
    });
    expect(child.projectId).toBe(projectA.id);
    expect(child.parentId).toBe(root.id);
  });

  it('moving a page to a different project cascades the denormalized projectId to its descendants', async () => {
    const root = await createPage.execute({
      ownerId,
      parentId: projectA.id,
      title: 'Root',
    });
    const child = await createPage.execute({
      ownerId,
      parentId: root.id,
      title: 'Child',
    });
    const grandchild = await createPage.execute({
      ownerId,
      parentId: child.id,
      title: 'Grandchild',
    });

    await movePage.execute({
      ownerId,
      pageId: root.id,
      targetParentId: projectB.id,
      index: 0,
    });

    const movedChild = await pageRepository.findById(child.id);
    const movedGrandchild = await pageRepository.findById(grandchild.id);
    expect(movedChild?.projectId).toBe(projectB.id);
    expect(movedGrandchild?.projectId).toBe(projectB.id);
    // the nested structure itself is untouched — only the project scoping changed
    expect(movedChild?.parentId).toBe(root.id);
    expect(movedGrandchild?.parentId).toBe(child.id);
  });

  it('rejects moving a page into its own descendant', async () => {
    const root = await createPage.execute({
      ownerId,
      parentId: projectA.id,
      title: 'Root',
    });
    const child = await createPage.execute({
      ownerId,
      parentId: root.id,
      title: 'Child',
    });

    await expect(
      movePage.execute({
        ownerId,
        pageId: root.id,
        targetParentId: child.id,
        index: 0,
      }),
    ).rejects.toThrow(InvalidMoveError);
  });

  it('rejects moving a page directly onto itself', async () => {
    const root = await createPage.execute({
      ownerId,
      parentId: projectA.id,
      title: 'Root',
    });

    await expect(
      movePage.execute({
        ownerId,
        pageId: root.id,
        targetParentId: root.id,
        index: 0,
      }),
    ).rejects.toThrow(InvalidMoveError);
  });

  it('duplicates a page along with its whole subtree', async () => {
    const root = await createPage.execute({
      ownerId,
      parentId: projectA.id,
      title: 'Root',
    });
    await createPage.execute({ ownerId, parentId: root.id, title: 'Child' });

    const clones = await duplicatePage.execute({ ownerId, pageId: root.id });

    expect(clones).toHaveLength(2);
    const clonedRoot = clones.find((page) => page.parentId === null)!;
    const clonedChild = clones.find((page) => page.parentId !== null)!;
    expect(clonedRoot.title).toBe('Root (copy)');
    expect(clonedChild.title).toBe('Child');
    expect(clonedChild.parentId).toBe(clonedRoot.id);
    expect(clonedRoot.id).not.toBe(root.id);

    // originals still exist, untouched
    const originals = await pageRepository.findAllForProjects([projectA.id]);
    expect(
      originals.some((page) => page.id === root.id && page.title === 'Root'),
    ).toBe(true);
    expect(originals).toHaveLength(4); // 2 originals (Root, Child) + 2 clones
  });
});
