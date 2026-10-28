import { Project } from '../../src/domain/hierarchy/project.model.js';
import { ProjectRepository } from '../../src/domain/hierarchy/project.repository.js';
import type { InMemorySpaceRepository } from './in-memory-space.repository.js';

export class InMemoryProjectRepository extends ProjectRepository {
  private readonly projects = new Map<string, Project>();

  constructor(private readonly spaceRepository: InMemorySpaceRepository) {
    super();
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<Project | null> {
    const project = this.projects.get(id);
    if (!project) return null;
    const space = await this.spaceRepository.findByIdForOwner(
      project.spaceId,
      ownerId,
    );
    return space ? project : null;
  }

  async findSiblings(spaceId: string): Promise<Project[]> {
    return [...this.projects.values()]
      .filter(
        (project) => project.spaceId === spaceId && project.parentId === null,
      )
      .sort((a, b) => a.position - b.position);
  }

  async findAllForSpaces(spaceIds: string[]): Promise<Project[]> {
    const ids = new Set(spaceIds);
    return [...this.projects.values()]
      .filter((project) => ids.has(project.spaceId))
      .sort((a, b) => a.position - b.position);
  }

  async save(project: Project): Promise<void> {
    this.projects.set(project.id, project);
  }

  async saveMany(projects: Project[]): Promise<void> {
    for (const project of projects) this.projects.set(project.id, project);
  }

  async delete(id: string): Promise<void> {
    this.projects.delete(id);
  }
}
