import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getSiblings,
  HIERARCHY_TREE_QUERY_KEY,
  hierarchyApi,
  type HierarchyNode,
  type NodeKind,
} from '@/entities/hierarchy-node'

interface TreeData {
  nodes: HierarchyNode[]
}

export interface MoveNodeInput {
  id: string
  kind: NodeKind
  targetParentId: string | null
  index: number
}

/**
 * Places the moved node at a temporary midpoint position for an instant,
 * correctly-ordered render. The exact number is discarded once the mutation
 * settles and the tree is refetched from the server.
 */
function applyOptimisticMove(nodes: HierarchyNode[], move: MoveNodeInput): HierarchyNode[] {
  const siblings = getSiblings(nodes, move.targetParentId, move.id)
  const index = Math.max(0, Math.min(move.index, siblings.length))
  const prevPosition = index > 0 ? siblings[index - 1].position : 0
  const nextPosition = index < siblings.length ? siblings[index].position : prevPosition + 2
  const position = (prevPosition + nextPosition) / 2

  return nodes.map((node) =>
    node.id === move.id ? { ...node, parentId: move.targetParentId, position } : node,
  )
}

export function useMoveNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MoveNodeInput) => hierarchyApi.move(input),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: HIERARCHY_TREE_QUERY_KEY });
      const previous = queryClient.getQueryData<TreeData>(HIERARCHY_TREE_QUERY_KEY)
      if (previous) {
        queryClient.setQueryData<TreeData>(HIERARCHY_TREE_QUERY_KEY, {
          nodes: applyOptimisticMove(previous.nodes, variables),
        })
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(HIERARCHY_TREE_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: HIERARCHY_TREE_QUERY_KEY }),
  })
}
