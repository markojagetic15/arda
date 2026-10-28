import { Injectable } from '@nestjs/common';

import { PageNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Page } from '../../../domain/hierarchy/page.model.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';

@Injectable()
export class RenamePageUseCase {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: {
    ownerId: string;
    pageId: string;
    title: string;
  }): Promise<Page> {
    const page = await this.pageRepository.findByIdForOwner(
      input.pageId,
      input.ownerId,
    );
    if (!page) {
      throw new PageNotFoundError();
    }
    page.rename(input.title);
    await this.pageRepository.save(page);
    return page;
  }
}
