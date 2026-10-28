import { Space } from '../../src/domain/hierarchy/space.model.js';
import { SpaceRepository } from '../../src/domain/hierarchy/space.repository.js';

export class InMemorySpaceRepository extends SpaceRepository {
  private readonly spaces = new Map<string, Space>();

  async findByIdForOwner(id: string, ownerId: string): Promise<Space | null> {
    const space = this.spaces.get(id);
    return space && space.ownerId === ownerId ? space : null;
  }

  async findById(id: string): Promise<Space | null> {
    return this.spaces.get(id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Space[]> {
    return ids.map((id) => this.spaces.get(id)).filter((s): s is Space => !!s);
  }

  async findRootSiblings(ownerId: string): Promise<Space[]> {
    return [...this.spaces.values()]
      .filter((space) => space.ownerId === ownerId && space.parentId === null)
      .sort((a, b) => a.position - b.position);
  }

  async findAllForOwner(ownerId: string): Promise<Space[]> {
    return [...this.spaces.values()]
      .filter((space) => space.ownerId === ownerId)
      .sort((a, b) => a.position - b.position);
  }

  async save(space: Space): Promise<void> {
    this.spaces.set(space.id, space);
  }

  async saveMany(spaces: Space[]): Promise<void> {
    for (const space of spaces) this.spaces.set(space.id, space);
  }

  async delete(id: string): Promise<void> {
    this.spaces.delete(id);
  }
}
