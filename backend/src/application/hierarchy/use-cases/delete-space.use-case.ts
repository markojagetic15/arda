import { Injectable } from '@nestjs/common';

import { SpaceNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';

@Injectable()
export class DeleteSpaceUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute(input: { ownerId: string; spaceId: string }): Promise<void> {
    const space = await this.spaceRepository.findByIdForOwner(
      input.spaceId,
      input.ownerId,
    );
    if (!space) {
      throw new SpaceNotFoundError();
    }
    await this.spaceRepository.delete(space.id);
  }
}
