import { useMutation, useQueryClient } from '@tanstack/react-query'

import { HIERARCHY_TREE_QUERY_KEY, hierarchyApi, type HierarchyNode } from '@/entities/hierarchy-node'

export function useCreateSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hierarchyApi.createSpace,
    onSuccess: (space) => {
      queryClient.setQueryData<{ nodes: HierarchyNode[] }>(HIERARCHY_TREE_QUERY_KEY, (data) =>
        data ? { nodes: [...data.nodes, space] } : { nodes: [space] },
      )
    },
    // The server decides the creator's role on the new nodes.
    onSettled: () => queryClient.invalidateQueries({ queryKey: HIERARCHY_TREE_QUERY_KEY }),
  })
}
