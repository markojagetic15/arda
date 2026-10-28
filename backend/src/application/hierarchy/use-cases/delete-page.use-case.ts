import { Injectable } from '@nestjs/common';

import { PageNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';
import { AccessService } from '../../access/access.service.js';

@Injectable()
export class DeletePageUseCase {
  constructor(
    private readonly pageRepository: PageRepository,
    private readonly access: AccessService,
  ) {}

  async execute(input: { ownerId: string; pageId: string }): Promise<void> {
    const page = await this.access.pageFor(input.ownerId, input.pageId, 'edit');
    if (!page) {
      throw new PageNotFoundError();
    }
    await this.pageRepository.delete(page.id);
  }
}
