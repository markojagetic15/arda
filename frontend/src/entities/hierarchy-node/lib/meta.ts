import { FileText, KanbanSquare, PenTool, type LucideIcon } from 'lucide-react'

import type { HierarchyNode, PageType } from '../model/types'

export interface PageTypeMeta {
  type: PageType
  label: string
  description: string
  icon: LucideIcon
  /** Text color for the icon. */
  color: string
  /** Soft background tile behind the icon. */
  tile: string
}

export const PAGE_TYPES: PageTypeMeta[] = [
  {
    type: 'document',
    label: 'Document',
    description: 'Rich text with full styling',
    icon: FileText,
    color: 'text-sky-500',
    tile: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  },
  {
    type: 'canvas',
    label: 'Canvas',
    description: 'Infinite whiteboard',
    icon: PenTool,
    color: 'text-fuchsia-500',
    tile: 'bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-400',
  },
  {
    type: 'kanban',
    label: 'Board',
    description: 'Kanban task board',
    icon: KanbanSquare,
    color: 'text-amber-500',
    tile: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  },
]

export function pageTypeMeta(type: PageType | undefined): PageTypeMeta {
  return PAGE_TYPES.find((meta) => meta.type === type) ?? PAGE_TYPES[0]
}

const SPACE_COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#db2777', '#4f46e5', '#ea580c']

/** Stable color per space id, for its letter tile. */
export function spaceColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return SPACE_COLORS[Math.abs(hash) % SPACE_COLORS.length]
}

/** The chain of nodes from the root down to (and including) `id`. */
export function getAncestry(nodes: HierarchyNode[], id: string): HierarchyNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const chain: HierarchyNode[] = []
  let cursor = byId.get(id)
  while (cursor) {
    chain.unshift(cursor)
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
  }
  return chain
}
