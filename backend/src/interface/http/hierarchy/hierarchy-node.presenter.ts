import type { Role } from '../../../domain/access/role.js';
import type { PageType } from '../../../domain/hierarchy/page-type.js';
import type { Page } from '../../../domain/hierarchy/page.model.js';
import type { Project } from '../../../domain/hierarchy/project.model.js';
import type { Space } from '../../../domain/hierarchy/space.model.js';
import type { NodeKind } from './node-kind.js';

export interface HierarchyNodeDto {
  id: string;
  kind: NodeKind;
  label: string;
  parentId: string | null;
  position: number;
  pageType?: PageType;
  /** The requesting user's access to this node. */
  role?: Role;
}

export function presentSpace(space: Space, role?: Role): HierarchyNodeDto {
  return {
    role,
    id: space.id,
    kind: 'space',
    label: space.name,
    parentId: space.parentId,
    position: space.position,
  };
}

export function presentProject(
  project: Project,
  role?: Role,
): HierarchyNodeDto {
  return {
    role,
    id: project.id,
    kind: 'project',
    label: project.name,
    parentId: project.parentId ?? project.spaceId,
    position: project.position,
  };
}

export function presentPage(page: Page, role?: Role): HierarchyNodeDto {
  return {
    role,
    id: page.id,
    kind: 'page',
    label: page.title,
    parentId: page.parentId ?? page.projectId,
    position: page.position,
    pageType: page.type,
  };
}
