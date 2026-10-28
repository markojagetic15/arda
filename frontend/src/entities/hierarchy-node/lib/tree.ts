import type { HierarchyNode } from '../model/types'

/** A node's id plus every descendant's id, reachable via `parentId`. */
export function collectSubtreeIds(nodes: HierarchyNode[], rootId: string): Set<string> {
  const byParent = new Map<string, HierarchyNode[]>()
  for (const node of nodes) {
    if (node.parentId === null) continue
    const list = byParent.get(node.parentId) ?? []
    list.push(node)
    byParent.set(node.parentId, list)
  }

  const ids = new Set<string>([rootId])
  const queue = [rootId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const child of byParent.get(current) ?? []) {
      if (!ids.has(child.id)) {
        ids.add(child.id)
        queue.push(child.id)
      }
    }
  }
  return ids
}

export function getSiblings(
  nodes: HierarchyNode[],
  parentId: string | null,
  excludeId?: string,
): HierarchyNode[] {
  return nodes
    .filter((node) => node.parentId === parentId && node.id !== excludeId)
    .sort((a, b) => a.position - b.position)
}
