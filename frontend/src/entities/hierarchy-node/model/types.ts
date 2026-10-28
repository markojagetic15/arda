export type NodeKind = 'space' | 'project' | 'page'

export type PageType = 'document' | 'canvas' | 'kanban'

export interface HierarchyNode {
  id: string
  kind: NodeKind
  label: string
  parentId: string | null
  position: number
  pageType?: PageType
}
