import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { PageNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Page } from '../../../domain/hierarchy/page.model.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';
import { PageType } from '../../../domain/hierarchy/page-type.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';
import { planPosition } from '../position-planner.js';

/**
 * `parentId` is deliberately ambiguous — it names either the project the new
 * page should root under, or an existing page it should nest under.
 */
@Injectable()
export class CreatePageUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly pageRepository: PageRepository,
  ) {}

  async execute(input: {
    ownerId: string;
    parentId: string;
    title?: string;
    type?: PageType;
  }): Promise<Page> {
    const targetProject = await this.projectRepository.findByIdForOwner(
      input.parentId,
      input.ownerId,
    );

    let projectId: string;
    let parentPageId: string | null;

    if (targetProject) {
      projectId = targetProject.id;
      parentPageId = null;
    } else {
      const parentPage = await this.pageRepository.findByIdForOwner(
        input.parentId,
        input.ownerId,
      );
      if (!parentPage) {
        throw new PageNotFoundError();
      }
      projectId = parentPage.projectId;
      parentPageId = parentPage.id;
    }

    const siblings = await this.pageRepository.findSiblings(
      projectId,
      parentPageId,
    );
    const plan = planPosition(siblings, siblings.length);
    if (plan.rebalanced) {
      siblings.forEach((sibling, index) =>
        sibling.reorder(plan.rebalanced![index]),
      );
      await this.pageRepository.saveMany(siblings);
    }

    const page = Page.create({
      id: randomUUID(),
      title: input.title?.trim() || 'Untitled',
      type: input.type,
      projectId,
      parentId: parentPageId,
      position: plan.position,
    });
    await this.pageRepository.save(page);
    return page;
  }
}
