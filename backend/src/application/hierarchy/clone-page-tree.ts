import { randomUUID } from 'node:crypto';

import { Page } from '../../domain/hierarchy/page.model.js';

function buildIdMap(pages: Page[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const page of pages) {
    map.set(page.id, randomUUID());
  }
  return map;
}

/**
 * Clones every page belonging to a project - a forest of one or more root
 * pages plus their descendants - into a fresh, empty target project.
 */
export function clonePageForest(
  sourcePages: Page[],
  targetProjectId: string,
): Page[] {
  const idMap = buildIdMap(sourcePages);
  return sourcePages.map((page) =>
    Page.create({
      id: idMap.get(page.id)!,
      title: page.title,
      type: page.type,
      projectId: targetProjectId,
      parentId:
        page.parentId === null ? null : (idMap.get(page.parentId) ?? null),
      position: page.position,
    }),
  );
}

/**
 * Clones a single page and all of its descendants, re-rooting the clone
 * under a new parent and position. `sourcePages` must contain `rootPageId`
 * plus every one of its descendants (any depth).
 */
export function clonePageSubtree(
  sourcePages: Page[],
  rootPageId: string,
  targetProjectId: string,
  targetParentId: string | null,
  rootPosition: number,
): Page[] {
  const idMap = buildIdMap(sourcePages);
  return sourcePages.map((page) => {
    const isRoot = page.id === rootPageId;
    return Page.create({
      id: idMap.get(page.id)!,
      title: isRoot ? `${page.title} (copy)` : page.title,
      type: page.type,
      projectId: targetProjectId,
      parentId: isRoot
        ? targetParentId
        : (idMap.get(page.parentId!) ?? targetParentId),
      position: isRoot ? rootPosition : page.position,
    });
  });
}
