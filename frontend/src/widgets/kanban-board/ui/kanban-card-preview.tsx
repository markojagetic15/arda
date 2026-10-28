import type { KanbanCard } from '../model/types'

export function KanbanCardPreview({ card }: { card: KanbanCard }) {
  return (
    <div className="rounded-md border border-current/10 bg-background p-2 shadow-lg">
      <p className="text-sm font-medium">{card.title}</p>
      {card.description ? <p className="mt-1 text-xs opacity-80">{card.description}</p> : null}
    </div>
  )
}
