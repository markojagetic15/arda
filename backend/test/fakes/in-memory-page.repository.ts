import { Page } from '../../src/domain/hierarchy/page.model.js';
import { PageRepository } from '../../src/domain/hierarchy/page.repository.js';
import type { InMemoryProjectRepository } from './in-memory-project.repository.js';

export class InMemoryPageRepository extends PageRepository {
  private readonly pages = new Map<string, Page>();

  constructor(private readonly projectRepository: InMemoryProjectRepository) {
    super();
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<Page | null> {
    const page = this.pages.get(id);
    if (!page) return null;
    const project = await this.projectRepository.findByIdForOwner(
      page.projectId,
      ownerId,
    );
    return project ? page : null;
  }

  async findById(id: string): Promise<Page | null> {
    return this.pages.get(id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Page[]> {
    return ids
      .map((id) => this.pages.get(id))
      .filter((page): page is Page => page !== undefined);
  }

  async findSiblings(
    projectId: string,
    parentId: string | null,
  ): Promise<Page[]> {
    return [...this.pages.values()]
      .filter(
        (page) => page.projectId === projectId && page.parentId === parentId,
      )
      .sort((a, b) => a.position - b.position);
  }

  async findAllForProjects(projectIds: string[]): Promise<Page[]> {
    const ids = new Set(projectIds);
    return [...this.pages.values()]
      .filter((page) => ids.has(page.projectId))
      .sort((a, b) => a.position - b.position);
  }

  async findChildrenIds(parentIds: string[]): Promise<string[]> {
    const ids = new Set(parentIds);
    return [...this.pages.values()]
      .filter((page) => page.parentId !== null && ids.has(page.parentId))
      .map((page) => page.id);
  }

  async save(page: Page): Promise<void> {
    this.pages.set(page.id, page);
  }

  async saveMany(pages: Page[]): Promise<void> {
    for (const page of pages) this.pages.set(page.id, page);
  }

  async reassignProjectForIds(
    ids: string[],
    newProjectId: string,
  ): Promise<void> {
    for (const id of ids) {
      const page = this.pages.get(id);
      if (page) {
        page.moveTo(newProjectId, page.parentId, page.position);
      }
    }
  }

  async delete(id: string): Promise<void> {
    this.pages.delete(id);
  }
}
