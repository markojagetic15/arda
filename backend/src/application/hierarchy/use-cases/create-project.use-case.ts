import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { SpaceNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Page } from '../../../domain/hierarchy/page.model.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';
import { PageType } from '../../../domain/hierarchy/page-type.js';
import { POSITION_GAP } from '../../../domain/hierarchy/position.js';
import { Project } from '../../../domain/hierarchy/project.model.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';
import { AccessService } from '../../access/access.service.js';
import { planPosition } from '../position-planner.js';

const DEFAULT_PAGES = [
  { title: 'Document', type: PageType.DOCUMENT },
  { title: 'Canvas', type: PageType.CANVAS },
  { title: 'Board', type: PageType.KANBAN },
];

export interface CreateProjectResult {
  project: Project;
  pages: Page[];
}

/** Every new project starts with the three default collaborative pages. */
@Injectable()
export class CreateProjectUseCase {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly pageRepository: PageRepository,
    private readonly access: AccessService,
  ) {}

  async execute(input: {
    ownerId: string;
    spaceId: string;
    name: string;
  }): Promise<CreateProjectResult> {
    const space = await this.access.spaceFor(
      input.ownerId,
      input.spaceId,
      'edit',
    );
    if (!space) {
      throw new SpaceNotFoundError();
    }

    const siblings = await this.projectRepository.findSiblings(input.spaceId);
    const plan = planPosition(siblings, siblings.length);
    if (plan.rebalanced) {
      siblings.forEach((sibling, index) =>
        sibling.reorder(plan.rebalanced![index]),
      );
      await this.projectRepository.saveMany(siblings);
    }

    const project = Project.create({
      id: randomUUID(),
      name: input.name,
      spaceId: input.spaceId,
      position: plan.position,
    });
    await this.projectRepository.save(project);

    const pages = DEFAULT_PAGES.map((defaults, index) =>
      Page.create({
        id: randomUUID(),
        title: defaults.title,
        type: defaults.type,
        projectId: project.id,
        parentId: null,
        position: (index + 1) * POSITION_GAP,
      }),
    );
    await this.pageRepository.saveMany(pages);

    return { project, pages };
  }
}
