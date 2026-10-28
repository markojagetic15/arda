import { useMutation, useQueryClient } from '@tanstack/react-query'

import { HIERARCHY_TREE_QUERY_KEY, hierarchyApi, type HierarchyNode } from '@/entities/hierarchy-node'

interface TreeData {
  nodes: HierarchyNode[]
}

export function useRenameNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hierarchyApi.rename,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: HIERARCHY_TREE_QUERY_KEY })
      const previous = queryClient.getQueryData<TreeData>(HIERARCHY_TREE_QUERY_KEY)
      queryClient.setQueryData<TreeData>(HIERARCHY_TREE_QUERY_KEY, (data) =>
        data
          ? {
              nodes: data.nodes.map((node) =>
                node.id === variables.id ? { ...node, label: variables.label } : node,
              ),
            }
          : data,
      )
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
