import { Injectable } from '@nestjs/common';

import { ProjectNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';
import { AccessService } from '../../access/access.service.js';

@Injectable()
export class DeleteProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly access: AccessService,
  ) {}

  async execute(input: { ownerId: string; projectId: string }): Promise<void> {
    const project = await this.access.projectFor(
      input.ownerId,
      input.projectId,
      'edit',
    );
    if (!project) {
      throw new ProjectNotFoundError();
    }
    await this.projectRepository.delete(project.id);
  }
}
