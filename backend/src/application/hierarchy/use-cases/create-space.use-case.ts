import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { Space } from '../../../domain/hierarchy/space.model.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';
import { planPosition } from '../position-planner.js';

@Injectable()
export class CreateSpaceUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute(input: { ownerId: string; name: string }): Promise<Space> {
    const siblings = await this.spaceRepository.findRootSiblings(input.ownerId);
    const plan = planPosition(siblings, siblings.length);
    if (plan.rebalanced) {
      siblings.forEach((sibling, index) =>
        sibling.reorder(plan.rebalanced![index]),
      );
      await this.spaceRepository.saveMany(siblings);
    }

    const space = Space.create({
      id: randomUUID(),
      name: input.name,
      ownerId: input.ownerId,
      position: plan.position,
    });
    await this.spaceRepository.save(space);
    return space;
  }
}
