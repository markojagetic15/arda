import { Injectable } from '@nestjs/common';

import {
  InvalidMoveError,
  PageNotFoundError,
} from '../../../domain/hierarchy/hierarchy.errors.js';
import { Page } from '../../../domain/hierarchy/page.model.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';
import { AccessService } from '../../access/access.service.js';
import { planPosition } from '../position-planner.js';

/**
 * `targetParentId` is deliberately ambiguous - it names either the project
 * the page should root under, or an existing page it should nest under.
 */
@Injectable()
export class MovePageUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly pageRepository: PageRepository,
    private readonly access: AccessService,
  ) {}

  async execute(input: {
    ownerId: string;
    pageId: string;
    targetParentId: string;
    index: number;
  }): Promise<Page> {
    const page = await this.access.pageFor(input.ownerId, input.pageId, 'edit');
    if (!page) {
      throw new PageNotFoundError();
    }

    const targetProject = await this.access.projectFor(
      input.ownerId,
      input.targetParentId,
      'edit',
    );

    let targetProjectId: string;
    let targetParentPageId: string | null;

    if (targetProject) {
      targetProjectId = targetProject.id;
      targetParentPageId = null;
    } else {
      const targetParentPage = await this.access.pageFor(
        input.ownerId,
        input.targetParentId,
        'edit',
      );
      if (!targetParentPage) {
        throw new PageNotFoundError();
      }
      await this.assertNoCycle(page.id, targetParentPage);
      targetProjectId = targetParentPage.projectId;
      targetParentPageId = targetParentPage.id;
    }

    const siblings = (
      await this.pageRepository.findSiblings(
        targetProjectId,
        targetParentPageId,
      )
    ).filter((sibling) => sibling.id !== page.id);
    const index = Math.max(0, Math.min(input.index, siblings.length));
    const plan = planPosition(siblings, index);
    if (plan.rebalanced) {
      siblings.forEach((sibling, i) => sibling.reorder(plan.rebalanced![i]));
      await this.pageRepository.saveMany(siblings);
    }

    const projectChanged = page.projectId !== targetProjectId;
    page.moveTo(targetProjectId, targetParentPageId, plan.position);
    await this.pageRepository.save(page);

    if (projectChanged) {
      await this.cascadeProjectId(page.id, targetProjectId);
    }

    return page;
  }

  /** Walks up from the proposed new parent; rejects if the moved page is its own ancestor. */
  private async assertNoCycle(
    movedPageId: string,
    targetParentPage: Page,
  ): Promise<void> {
    let cursor: Page | null = targetParentPage;
    while (cursor) {
      if (cursor.id === movedPageId) {
        throw new InvalidMoveError();
      }
      cursor = cursor.parentId
        ? await this.pageRepository.findById(cursor.parentId)
        : null;
    }
  }

  /** Propagates the denormalized projectId down through every descendant, level by level. */
  private async cascadeProjectId(
    rootPageId: string,
    newProjectId: string,
  ): Promise<void> {
    let frontier = await this.pageRepository.findChildrenIds([rootPageId]);
    while (frontier.length > 0) {
      await this.pageRepository.reassignProjectForIds(frontier, newProjectId);
      frontier = await this.pageRepository.findChildrenIds(frontier);
    }
  }
}
