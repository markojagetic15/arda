import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, SVGProps } from 'react'

import type { Comment } from '@/shared/lib/comments'
import { CommentThreadTrigger } from '@/widgets/comment-thread'

import type { KanbanCard } from '../model/types'

function DragHandleGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 10 16" fill="currentColor" {...props}>
      {[3, 7].map((cx) => [3, 8, 13].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.1" />))}
    </svg>
  )
}

interface KanbanCardViewProps {
  card: KanbanCard
  comments: Comment[]
  onUpdate: (patch: Partial<Pick<KanbanCard, 'title' | 'description'>>) => void
  onDelete: () => void
  onCreateComment: (body: string) => void
  onResolveComment: (commentId: string, resolved: boolean) => void
}

export function KanbanCardView({
  card,
  comments,
  onUpdate,
  onDelete,
  onCreateComment,
  onResolveComment,
}: KanbanCardViewProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-md border border-current/10 bg-background p-2 shadow-sm ${isDragging ? 'opacity-40' : ''}`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to move task"
        className="absolute top-1.5 right-1.5 flex h-4 w-3 cursor-grab touch-none items-center justify-center opacity-0 group-hover:opacity-50"
      >
        <DragHandleGlyph className="h-3 w-3" />
      </button>

      <input
        value={card.title}
        onChange={(event) => onUpdate({ title: event.target.value })}
        aria-label="Task title"
        className="w-full pr-4 bg-transparent text-sm font-medium outline-none"
      />
      <textarea
        value={card.description}
        onChange={(event) => onUpdate({ description: event.target.value })}
        placeholder="Add a description…"
        rows={2}
        aria-label="Task description"
        className="mt-1 w-full resize-none bg-transparent text-xs opacity-80 outline-none placeholder:opacity-60"
      />
      <div className="mt-1 flex items-center justify-between">
        <CommentThreadTrigger
          comments={comments}
          anchorType="kanban-card"
          anchorId={card.id}
          onCreateComment={onCreateComment}
          onResolveToggle={onResolveComment}
        />
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete task"
          className="text-xs opacity-0 group-hover:opacity-50 hover:opacity-100"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
