import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { ProjectNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Page } from '../../../domain/hierarchy/page.model.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';
import { Project } from '../../../domain/hierarchy/project.model.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';
import { clonePageForest } from '../clone-page-tree.js';
import { planPosition } from '../position-planner.js';

export interface DuplicateProjectResult {
  project: Project;
  pages: Page[];
}

/** Duplicates a project and its entire page forest, landing right after the original. */
@Injectable()
export class DuplicateProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly pageRepository: PageRepository,
  ) {}

  async execute(input: {
    ownerId: string;
    projectId: string;
  }): Promise<DuplicateProjectResult> {
    const source = await this.projectRepository.findByIdForOwner(
      input.projectId,
      input.ownerId,
    );
    if (!source) {
      throw new ProjectNotFoundError();
    }

    const allSiblings = await this.projectRepository.findSiblings(
      source.spaceId,
    );
    const insertAt = allSiblings.findIndex(
      (sibling) => sibling.id === source.id,
    );
    const siblings = allSiblings.filter((sibling) => sibling.id !== source.id);
    const plan = planPosition(siblings, insertAt);
    if (plan.rebalanced) {
      siblings.forEach((sibling, i) => sibling.reorder(plan.rebalanced![i]));
      await this.projectRepository.saveMany(siblings);
    }

    const clonedProject = Project.create({
      id: randomUUID(),
      name: `${source.name} (copy)`,
      spaceId: source.spaceId,
      position: plan.position,
    });
    await this.projectRepository.save(clonedProject);

    const sourcePages = await this.pageRepository.findAllForProjects([
      source.id,
    ]);
    const clonedPages = clonePageForest(sourcePages, clonedProject.id);
    await this.pageRepository.saveMany(clonedPages);

    return { project: clonedProject, pages: clonedPages };
  }
}
