import { Injectable } from '@nestjs/common';

import {
  ProjectNotFoundError,
  SpaceNotFoundError,
} from '../../../domain/hierarchy/hierarchy.errors.js';
import { Project } from '../../../domain/hierarchy/project.model.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';
import { planPosition } from '../position-planner.js';

/** Moves a project to a (possibly different) space and/or reorders it among that space's projects. */
@Injectable()
export class MoveProjectUseCase {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(input: {
    ownerId: string;
    projectId: string;
    targetSpaceId: string;
    index: number;
  }): Promise<Project> {
    const project = await this.projectRepository.findByIdForOwner(
      input.projectId,
      input.ownerId,
    );
    if (!project) {
      throw new ProjectNotFoundError();
    }

    const targetSpace = await this.spaceRepository.findByIdForOwner(
      input.targetSpaceId,
      input.ownerId,
    );
    if (!targetSpace) {
      throw new SpaceNotFoundError();
    }

    const siblings = (
      await this.projectRepository.findSiblings(input.targetSpaceId)
    ).filter((sibling) => sibling.id !== project.id);
    const index = Math.max(0, Math.min(input.index, siblings.length));
    const plan = planPosition(siblings, index);
    if (plan.rebalanced) {
      siblings.forEach((sibling, i) => sibling.reorder(plan.rebalanced![i]));
      await this.projectRepository.saveMany(siblings);
    }

    project.moveToSpace(input.targetSpaceId, plan.position);
    await this.projectRepository.save(project);
    return project;
  }
}
