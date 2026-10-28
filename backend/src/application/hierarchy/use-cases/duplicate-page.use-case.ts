import { Injectable } from '@nestjs/common';

import { DocumentSnapshotRepository } from '../../../domain/collaboration/document-snapshot.repository.js';
import { PageNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Page } from '../../../domain/hierarchy/page.model.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';
import { AccessService } from '../../access/access.service.js';
import { clonePageSubtree } from '../clone-page-tree.js';
import { copySnapshots } from '../copy-snapshots.js';
import { planPosition } from '../position-planner.js';

/** Duplicates a page and its entire subtree, landing right after the original. */
@Injectable()
export class DuplicatePageUseCase {
  constructor(
    private readonly pageRepository: PageRepository,
    private readonly snapshotRepository: DocumentSnapshotRepository,
    private readonly access: AccessService,
  ) {}

  async execute(input: { ownerId: string; pageId: string }): Promise<Page[]> {
    const source = await this.access.pageFor(
      input.ownerId,
      input.pageId,
      'edit',
    );
    if (!source) {
      throw new PageNotFoundError();
    }

    const subtreeIds = [source.id];
    let frontier = [source.id];
    while (frontier.length > 0) {
      frontier = await this.pageRepository.findChildrenIds(frontier);
      subtreeIds.push(...frontier);
    }
    const subtreePages = await this.pageRepository.findByIds(subtreeIds);

    const allSiblings = await this.pageRepository.findSiblings(
      source.projectId,
      source.parentId,
    );
    const insertAt = allSiblings.findIndex(
      (sibling) => sibling.id === source.id,
    );
    const siblings = allSiblings.filter((sibling) => sibling.id !== source.id);
    const plan = planPosition(siblings, insertAt);
    if (plan.rebalanced) {
      siblings.forEach((sibling, i) => sibling.reorder(plan.rebalanced![i]));
      await this.pageRepository.saveMany(siblings);
    }

    const clones = clonePageSubtree(
      subtreePages,
      source.id,
      source.projectId,
      source.parentId,
      plan.position,
    );
    await this.pageRepository.saveMany(clones);
    await copySnapshots(this.snapshotRepository, subtreePages, clones);
    return clones;
  }
}
