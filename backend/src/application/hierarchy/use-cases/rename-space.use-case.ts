import { Injectable } from '@nestjs/common';

import { SpaceNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Space } from '../../../domain/hierarchy/space.model.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';

@Injectable()
export class RenameSpaceUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute(input: {
    ownerId: string;
    spaceId: string;
    name: string;
  }): Promise<Space> {
    const space = await this.spaceRepository.findByIdForOwner(
      input.spaceId,
      input.ownerId,
    );
    if (!space) {
      throw new SpaceNotFoundError();
    }
    space.rename(input.name);
    await this.spaceRepository.save(space);
    return space;
  }
}
