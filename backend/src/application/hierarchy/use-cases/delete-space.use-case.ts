import { Injectable } from '@nestjs/common';

import { SpaceNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';
import { AccessService } from '../../access/access.service.js';

@Injectable()
export class DeleteSpaceUseCase {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly access: AccessService,
  ) {}

  async execute(input: { ownerId: string; spaceId: string }): Promise<void> {
    const space = await this.access.spaceFor(
      input.ownerId,
      input.spaceId,
      'full',
    );
    if (!space) {
      throw new SpaceNotFoundError();
    }
    await this.spaceRepository.delete(space.id);
  }
}
