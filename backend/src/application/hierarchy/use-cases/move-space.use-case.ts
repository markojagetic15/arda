import { Injectable } from '@nestjs/common';

import { SpaceNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Space } from '../../../domain/hierarchy/space.model.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';
import { AccessService } from '../../access/access.service.js';
import { planPosition } from '../position-planner.js';

/** Spaces don't nest in this pass - moving a space only ever reorders it among the owner's root spaces. */
@Injectable()
export class MoveSpaceUseCase {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly access: AccessService,
  ) {}

  async execute(input: {
    ownerId: string;
    spaceId: string;
    index: number;
  }): Promise<Space> {
    const space = await this.access.spaceFor(
      input.ownerId,
      input.spaceId,
      'full',
    );
    if (!space) {
      throw new SpaceNotFoundError();
    }

    const siblings = (
      await this.spaceRepository.findRootSiblings(space.ownerId)
    ).filter((sibling) => sibling.id !== space.id);
    const index = Math.max(0, Math.min(input.index, siblings.length));
    const plan = planPosition(siblings, index);
    if (plan.rebalanced) {
      siblings.forEach((sibling, i) => sibling.reorder(plan.rebalanced![i]));
      await this.spaceRepository.saveMany(siblings);
    }

    space.reorder(plan.position);
    await this.spaceRepository.save(space);
    return space;
  }
}
