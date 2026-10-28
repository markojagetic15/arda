import type { HierarchyNode } from '@/entities/hierarchy-node'

export interface FlatNode extends HierarchyNode {
  depth: number
  hasChildren: boolean
}

/** Depth-first flattening of the tree, skipping the subtrees of collapsed nodes. */
export function flattenTree(nodes: HierarchyNode[], collapsedIds: Set<string>): FlatNode[] {
  const byParent = new Map<string | null, HierarchyNode[]>()
  for (const node of nodes) {
    const list = byParent.get(node.parentId) ?? []
    list.push(node)
    byParent.set(node.parentId, list)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.position - b.position)
  }

  const result: FlatNode[] = []

  function visit(parentId: string | null, depth: number): void {
    for (const node of byParent.get(parentId) ?? []) {
      const hasChildren = (byParent.get(node.id)?.length ?? 0) > 0
      result.push({ ...node, depth, hasChildren })
      if (hasChildren && !collapsedIds.has(node.id)) {
        visit(node.id, depth + 1)
      }
    }
  }

  visit(null, 0)
  return result
}
