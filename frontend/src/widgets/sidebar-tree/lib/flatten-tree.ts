import type { HierarchyNode } from '@/entities/hierarchy-node'

export interface FlatNode extends HierarchyNode {
  depth: number
  hasChildren: boolean
}

export interface TreeSections {
  /** Spaces the user owns or was given, with everything under them. */
  spaces: FlatNode[]
  /** Projects and pages shared with the user whose parent they can't see. */
  shared: FlatNode[]
}

/** Depth-first flattening, skipping the subtrees of collapsed nodes. */
export function flattenTree(nodes: HierarchyNode[], collapsedIds: Set<string>): TreeSections {
  const ids = new Set(nodes.map((node) => node.id))
  const byParent = new Map<string | null, HierarchyNode[]>()
  for (const node of nodes) {
    // A node whose parent isn't visible is a root of the "Shared with me" section.
    const key = node.parentId !== null && ids.has(node.parentId) ? node.parentId : null
    const list = byParent.get(key) ?? []
    list.push(node)
    byParent.set(key, list)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.position - b.position || a.label.localeCompare(b.label))
  }

  function visit(list: HierarchyNode[], depth: number, out: FlatNode[]): void {
    for (const node of list) {
      const children = byParent.get(node.id) ?? []
      out.push({ ...node, depth, hasChildren: children.length > 0 })
      if (children.length > 0 && !collapsedIds.has(node.id)) visit(children, depth + 1, out)
    }
  }

  const roots = byParent.get(null) ?? []
  const spaces: FlatNode[] = []
  const shared: FlatNode[] = []
  visit(
    roots.filter((node) => node.kind === 'space'),
    0,
    spaces,
  )
  visit(
    roots.filter((node) => node.kind !== 'space'),
    0,
    shared,
  )
  return { spaces, shared }
}
