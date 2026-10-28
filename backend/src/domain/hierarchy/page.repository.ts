import type { Page } from './page.model.js';

export abstract class PageRepository {
  /** Verifies ownership by joining through the page's project and space. */
  abstract findByIdForOwner(id: string, ownerId: string): Promise<Page | null>;
  /** Plain lookup with no ownership check — for internal ancestor-chain walks only. */
  abstract findById(id: string): Promise<Page | null>;
  abstract findByIds(ids: string[]): Promise<Page[]>;
  /** Siblings sharing the same project and parent (null = root pages), ordered by position. */
  abstract findSiblings(
    projectId: string,
    parentId: string | null,
  ): Promise<Page[]>;
  /** All pages across a set of projects — used to assemble the full tree. */
  abstract findAllForProjects(projectIds: string[]): Promise<Page[]>;
  /** One BFS level of a subtree walk: ids of pages whose parent is in `parentIds`. */
  abstract findChildrenIds(parentIds: string[]): Promise<string[]>;
  abstract save(page: Page): Promise<void>;
  abstract saveMany(pages: Page[]): Promise<void>;
  /** Bulk-reassigns the denormalized projectId — one step of a subtree cascade. */
  abstract reassignProjectForIds(
    ids: string[],
    newProjectId: string,
  ): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
