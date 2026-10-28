import { collectSubtreeIds, getSiblings, hasRole, type HierarchyNode } from '@/entities/hierarchy-node'
import type { MoveNodeInput } from '@/features/hierarchy-tree'

import type { FlatNode } from './flatten-tree'

export type DropPosition = 'before' | 'after' | 'inside'

export interface DropIndicator {
  overId: string
  position: DropPosition
}

/** Where within the hovered row the pointer is: top quarter, bottom quarter, or the middle. */
export function classifyDropPosition(overRect: { top: number; height: number }, pointerY: number): DropPosition {
  const ratio = (pointerY - overRect.top) / overRect.height
  if (ratio < 0.28) return 'before'
  if (ratio > 0.72) return 'after'
  return 'inside'
}

/**
 * Mirrors the backend's move rules: spaces only reorder among spaces;
 * projects reorder among projects or go inside a space; pages reorder among
 * pages or go inside a project/page. The user needs edit access where the
 * item lands, and a node can't move into its own subtree.
 */
export function isValidDrop(nodes: HierarchyNode[], active: FlatNode, over: FlatNode, position: DropPosition): boolean {
  if (active.id === over.id) return false
  if (collectSubtreeIds(nodes, active.id).has(over.id)) return false

  const parent = position === 'inside' ? over : nodes.find((node) => node.id === over.parentId)
  if (!hasRole(parent?.role ?? over.role, 'edit')) return false

  if (active.kind === 'space') {
    return over.kind === 'space' && position !== 'inside'
  }
  if (active.kind === 'project') {
    if (position === 'inside') return over.kind === 'space'
    return over.kind === 'project'
  }
  if (position === 'inside') return over.kind === 'project' || over.kind === 'page'
  return over.kind === 'page'
}

export function computeMove(
  nodes: HierarchyNode[],
  active: FlatNode,
  over: FlatNode,
  position: DropPosition,
): MoveNodeInput | null {
  if (!isValidDrop(nodes, active, over, position)) {
    return null
  }

  if (position === 'inside') {
    const targetParentId = over.id
    const index = getSiblings(nodes, targetParentId, active.id).length
    return { id: active.id, kind: active.kind, targetParentId, index }
  }

  const targetParentId = over.parentId
  const siblings = getSiblings(nodes, targetParentId, active.id)
  const overIndex = siblings.findIndex((sibling) => sibling.id === over.id)
  const index = position === 'before' ? overIndex : overIndex + 1
  return { id: active.id, kind: active.kind, targetParentId, index }
}
