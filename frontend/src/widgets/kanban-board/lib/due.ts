export type DueState = 'overdue' | 'today' | 'soon' | 'later'

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function dueState(dueDate: string): DueState {
  const [year, month, day] = dueDate.split('-').map(Number)
  const due = new Date(year, month - 1, day).getTime()
  const today = startOfDay(new Date())
  const days = Math.round((due - today) / 86_400_000)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 3) return 'soon'
  return 'later'
}

export function formatDue(dueDate: string): string {
  const [year, month, day] = dueDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const state = dueState(dueDate)
  if (state === 'today') return 'Today'
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

export const DUE_STYLES: Record<DueState, string> = {
  overdue: 'bg-danger-soft text-danger-soft-foreground',
  today: 'bg-warning-soft text-warning-soft-foreground',
  soon: 'bg-accent-soft text-accent-soft-foreground',
  later: 'bg-surface-secondary text-muted',
}
