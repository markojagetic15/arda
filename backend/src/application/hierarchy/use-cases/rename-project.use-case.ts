import { Injectable } from '@nestjs/common';

import { ProjectNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { Project } from '../../../domain/hierarchy/project.model.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';
import { AccessService } from '../../access/access.service.js';

@Injectable()
export class RenameProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly access: AccessService,
  ) {}

  async execute(input: {
    ownerId: string;
    projectId: string;
    name: string;
  }): Promise<Project> {
    const project = await this.access.projectFor(
      input.ownerId,
      input.projectId,
      'edit',
    );
    if (!project) {
      throw new ProjectNotFoundError();
    }
    project.rename(input.name);
    await this.projectRepository.save(project);
    return project;
  }
}
