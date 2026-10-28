export type NodeKind = 'space' | 'project' | 'page'

export type PageType = 'document' | 'canvas' | 'kanban'

/** Access levels, weakest to strongest (matches the backend). */
export type Role = 'view' | 'comment' | 'edit' | 'full'

export interface HierarchyNode {
  id: string
  kind: NodeKind
  label: string
  parentId: string | null
  position: number
  pageType?: PageType
  /** The current user's access to this node. */
  role?: Role
}
