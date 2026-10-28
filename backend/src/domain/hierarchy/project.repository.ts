import type { Project } from './project.model.js';

export abstract class ProjectRepository {
  /** Verifies ownership by joining through the project's space. */
  abstract findByIdForOwner(
    id: string,
    ownerId: string,
  ): Promise<Project | null>;
  /** All projects directly in a space, ordered by position. */
  abstract findSiblings(spaceId: string): Promise<Project[]>;
  /** All projects across a set of spaces — used to assemble the full tree. */
  abstract findAllForSpaces(spaceIds: string[]): Promise<Project[]>;
  abstract save(project: Project): Promise<void>;
  abstract saveMany(projects: Project[]): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
