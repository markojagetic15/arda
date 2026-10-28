import { getSiblings, type HierarchyNode } from '@/entities/hierarchy-node'
import type { MoveNodeInput } from '@/features/hierarchy-tree'

import type { FlatNode } from './flatten-tree'

export type DropPosition = 'before' | 'after' | 'inside'

export interface DropIndicator {
  overId: string
  position: DropPosition
}

/** Classifies where within a hovered row's rect the dragged item's center currently sits. */
export function classifyDropPosition(overRect: { top: number; height: number }, referenceCenterY: number): DropPosition {
  const ratio = (referenceCenterY - overRect.top) / overRect.height
  if (ratio < 0.3) return 'before'
  if (ratio > 0.7) return 'after'
  return 'inside'
}

/**
 * Mirrors the backend's move rules: spaces only reorder among spaces;
 * projects reorder among projects or nest inside a space; pages reorder
 * among pages or nest inside a project/page.
 */
export function isValidDrop(active: FlatNode, over: FlatNode, position: DropPosition): boolean {
  if (active.id === over.id) return false

  if (active.kind === 'space') {
    return over.kind === 'space' && position !== 'inside'
  }
  if (active.kind === 'project') {
    if (position === 'inside') return over.kind === 'space'
    return over.kind === 'project'
  }
  // active.kind === 'page'
  if (position === 'inside') return over.kind === 'project' || over.kind === 'page'
  return over.kind === 'page'
}

export function computeMove(
  nodes: HierarchyNode[],
  active: FlatNode,
  over: FlatNode,
  position: DropPosition,
): MoveNodeInput | null {
  if (!isValidDrop(active, over, position)) {
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
