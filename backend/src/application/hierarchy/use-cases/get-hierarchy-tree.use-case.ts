import { Injectable } from '@nestjs/common';

import type { Role } from '../../../domain/access/role.js';
import { Page } from '../../../domain/hierarchy/page.model.js';
import { Project } from '../../../domain/hierarchy/project.model.js';
import { Space } from '../../../domain/hierarchy/space.model.js';
import { AccessService } from '../../access/access.service.js';

export interface HierarchyTree {
  spaces: Space[];
  projects: Project[];
  pages: Page[];
  /** The user's role on every returned node, by id. */
  roles: Map<string, Role>;
}

/**
 * Everything the user can see: their own spaces plus whatever was shared
 * with them. A shared project or page whose parent the user can't see comes
 * back without that parent - the client shows it under "Shared with me".
 */
@Injectable()
export class GetHierarchyTreeUseCase {
  constructor(private readonly access: AccessService) {}

  async execute(input: { ownerId: string }): Promise<HierarchyTree> {
    return this.access.accessibleTree(input.ownerId);
  }
}
