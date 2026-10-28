import { Injectable } from '@nestjs/common';

import { Page } from '../../../domain/hierarchy/page.model.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';
import { Project } from '../../../domain/hierarchy/project.model.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';
import { Space } from '../../../domain/hierarchy/space.model.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';

export interface HierarchyTree {
  spaces: Space[];
  projects: Project[];
  pages: Page[];
}

@Injectable()
export class GetHierarchyTreeUseCase {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly pageRepository: PageRepository,
  ) {}

  async execute(input: { ownerId: string }): Promise<HierarchyTree> {
    const spaces = await this.spaceRepository.findAllForOwner(input.ownerId);
    const projects = await this.projectRepository.findAllForSpaces(
      spaces.map((space) => space.id),
    );
    const pages = await this.pageRepository.findAllForProjects(
      projects.map((project) => project.id),
    );
    return { spaces, projects, pages };
  }
}
