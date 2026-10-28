export interface KanbanColumn {
  id: string
  title: string
  position: number
  /** Accent color of the column header dot. */
  color?: string
}

export interface KanbanLabel {
  id: string
  name: string
  color: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface KanbanCard {
  id: string
  columnId: string
  title: string
  description: string
  position: number
  labelIds: string[]
  /** ISO date (yyyy-mm-dd) or null. */
  dueDate: string | null
  priority: Priority | null
  checklist: ChecklistItem[]
  createdAt?: string
}

export type CardPatch = Partial<Omit<KanbanCard, 'id' | 'columnId' | 'position'>>

/** Cards written before labels/dates/checklists existed lack those fields. */
export function normalizeCard(card: Partial<KanbanCard> & Pick<KanbanCard, 'id' | 'columnId'>): KanbanCard {
  return {
    title: '',
    description: '',
    position: 0,
    labelIds: [],
    dueDate: null,
    priority: null,
    checklist: [],
    ...card,
  }
}

export const LABEL_COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#16a34a', '#ca8a04', '#ea580c', '#dc2626', '#db2777', '#64748b']

export const COLUMN_COLORS = ['#94a3b8', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4']

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#64748b' },
  { value: 'medium', label: 'Medium', color: '#2563eb' },
  { value: 'high', label: 'High', color: '#ea580c' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626' },
]
