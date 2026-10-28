import { useMutation, useQueryClient } from '@tanstack/react-query'

import { HIERARCHY_TREE_QUERY_KEY, hierarchyApi, type HierarchyNode } from '@/entities/hierarchy-node'

export function useCreatePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hierarchyApi.createPage,
    onSuccess: (page) => {
      queryClient.setQueryData<{ nodes: HierarchyNode[] }>(HIERARCHY_TREE_QUERY_KEY, (data) =>
        data ? { nodes: [...data.nodes, page] } : { nodes: [page] },
      )
    },
  })
}
