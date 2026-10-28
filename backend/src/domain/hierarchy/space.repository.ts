import type { Space } from './space.model.js';

export abstract class SpaceRepository {
  abstract findByIdForOwner(id: string, ownerId: string): Promise<Space | null>;
  /** Root-level spaces for an owner, ordered by position. */
  abstract findRootSiblings(ownerId: string): Promise<Space[]>;
  /** All spaces owned by the user — used to assemble the full tree. */
  abstract findAllForOwner(ownerId: string): Promise<Space[]>;
  abstract save(space: Space): Promise<void>;
  abstract saveMany(spaces: Space[]): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
