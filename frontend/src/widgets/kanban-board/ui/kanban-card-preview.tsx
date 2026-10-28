import type { Comment } from '@/shared/lib/comments'

import type { KanbanCard, KanbanLabel } from '../model/types'
import { KanbanCardFace } from './kanban-card'

export function KanbanCardPreview(props: { card: KanbanCard; labels: KanbanLabel[]; comments: Comment[] }) {
  return (
    <div className="w-72 rotate-2 cursor-grabbing rounded-xl border border-accent/40 bg-surface p-3 shadow-2xl">
      <KanbanCardFace {...props} />
    </div>
  )
}
