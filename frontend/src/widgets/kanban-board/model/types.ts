export interface KanbanColumn {
  id: string
  title: string
  position: number
}

export interface KanbanCard {
  id: string
  columnId: string
  title: string
  description: string
  position: number
}
