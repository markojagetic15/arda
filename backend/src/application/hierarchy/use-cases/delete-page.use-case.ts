import { Injectable } from '@nestjs/common';

import { PageNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';

@Injectable()
export class DeletePageUseCase {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: { ownerId: string; pageId: string }): Promise<void> {
    const page = await this.pageRepository.findByIdForOwner(
      input.pageId,
      input.ownerId,
    );
    if (!page) {
      throw new PageNotFoundError();
    }
    await this.pageRepository.delete(page.id);
  }
}
