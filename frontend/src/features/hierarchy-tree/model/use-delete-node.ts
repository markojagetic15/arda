import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  collectSubtreeIds,
  HIERARCHY_TREE_QUERY_KEY,
  hierarchyApi,
  type HierarchyNode,
} from '@/entities/hierarchy-node'

interface TreeData {
  nodes: HierarchyNode[]
}

export function useDeleteNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hierarchyApi.delete,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: HIERARCHY_TREE_QUERY_KEY })
      const previous = queryClient.getQueryData<TreeData>(HIERARCHY_TREE_QUERY_KEY)
      if (previous) {
        const toRemove = collectSubtreeIds(previous.nodes, variables.id)
        queryClient.setQueryData<TreeData>(HIERARCHY_TREE_QUERY_KEY, {
          nodes: previous.nodes.filter((node) => !toRemove.has(node.id)),
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
