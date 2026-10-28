import { useMutation, useQueryClient } from '@tanstack/react-query'

import { HIERARCHY_TREE_QUERY_KEY, hierarchyApi, type HierarchyNode } from '@/entities/hierarchy-node'

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hierarchyApi.createProject,
    onSuccess: ({ project, pages }) => {
      queryClient.setQueryData<{ nodes: HierarchyNode[] }>(HIERARCHY_TREE_QUERY_KEY, (data) =>
        data ? { nodes: [...data.nodes, project, ...pages] } : { nodes: [project, ...pages] },
      )
    },
  })
}
