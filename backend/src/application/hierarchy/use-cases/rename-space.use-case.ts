import { Injectable } from '@nestjs/common';

import { SpaceNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Space } from '../../../domain/hierarchy/space.model.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';
import { AccessService } from '../../access/access.service.js';

@Injectable()
export class RenameSpaceUseCase {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly access: AccessService,
  ) {}

  async execute(input: {
    ownerId: string;
    spaceId: string;
    name: string;
  }): Promise<Space> {
    const space = await this.access.spaceFor(
      input.ownerId,
      input.spaceId,
      'edit',
    );
    if (!space) {
      throw new SpaceNotFoundError();
    }
    space.rename(input.name);
    await this.spaceRepository.save(space);
    return space;
  }
}
