import { useQuery } from '@tanstack/react-query'

import { HIERARCHY_TREE_QUERY_KEY, hierarchyApi } from '@/entities/hierarchy-node'

export function useHierarchyTree() {
  return useQuery({
    queryKey: HIERARCHY_TREE_QUERY_KEY,
    queryFn: hierarchyApi.getTree,
    staleTime: 30_000,
  })
}
