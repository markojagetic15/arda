import { Injectable } from '@nestjs/common';

import { ProjectNotFoundError } from '../../../domain/hierarchy/hierarchy.errors.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';

@Injectable()
export class DeleteProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: { ownerId: string; projectId: string }): Promise<void> {
    const project = await this.projectRepository.findByIdForOwner(
      input.projectId,
      input.ownerId,
    );
    if (!project) {
      throw new ProjectNotFoundError();
    }
    await this.projectRepository.delete(project.id);
  }
}
