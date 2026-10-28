import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlignLeft, CalendarDays, CheckSquare, Flag, Link2, MessageSquare } from 'lucide-react'
import type { CSSProperties } from 'react'

import { extractPageLinks } from '@/entities/hierarchy-node'
import { commentsForAnchor, type Comment } from '@/shared/lib/comments'

import { DUE_STYLES, dueState, formatDue } from '../lib/due'
import { PRIORITIES, type KanbanCard, type KanbanLabel } from '../model/types'

interface KanbanCardFaceProps {
  card: KanbanCard
  labels: KanbanLabel[]
  comments: Comment[]
}

/** The card's visible content - shared by the sortable card and the drag preview. */
export function KanbanCardFace({ card, labels, comments }: KanbanCardFaceProps) {
  const cardLabels = card.labelIds
    .map((id) => labels.find((label) => label.id === id))
    .filter((label): label is KanbanLabel => Boolean(label))
  const done = card.checklist.filter((item) => item.done).length
  const commentCount = commentsForAnchor(comments, 'kanban-card', card.id).length
  const priority = PRIORITIES.find(({ value }) => value === card.priority)
  const linkedPages = extractPageLinks(card.description).length

  return (
    <>
      {cardLabels.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {cardLabels.map((label) => (
            <span
              key={label.id}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: `${label.color}1f`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-sm leading-snug font-medium break-words">{card.title || 'Untitled task'}</p>
      {card.description ? (
        <p className="mt-1 line-clamp-2 text-xs break-words text-muted">{card.description}</p>
      ) : null}
      {card.dueDate || card.checklist.length || commentCount || priority || card.description ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          {card.dueDate ? (
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${DUE_STYLES[dueState(card.dueDate)]}`}>
              <CalendarDays className="h-3 w-3" /> {formatDue(card.dueDate)}
            </span>
          ) : null}
          {priority ? (
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: priority.color }}>
              <Flag className="h-3 w-3" /> {priority.label}
            </span>
          ) : null}
          {card.checklist.length ? (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 ${
                done === card.checklist.length ? 'bg-success-soft text-success-soft-foreground' : ''
              }`}
            >
              <CheckSquare className="h-3 w-3" /> {done}/{card.checklist.length}
            </span>
          ) : null}
          {card.description ? <AlignLeft className="h-3 w-3" aria-label="Has description" /> : null}
          {linkedPages ? (
            <span className="inline-flex items-center gap-1" title={`${linkedPages} linked page${linkedPages === 1 ? '' : 's'}`}>
              <Link2 className="h-3 w-3" /> {linkedPages}
            </span>
          ) : null}
          {commentCount ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> {commentCount}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

interface KanbanCardViewProps extends KanbanCardFaceProps {
  onOpen: () => void
}

export function KanbanCardView({ card, labels, comments, onOpen }: KanbanCardViewProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      onKeyDown={(event) => event.key === 'Enter' && onOpen()}
      className={`cursor-pointer rounded-xl border border-border bg-surface p-3 shadow-xs transition-shadow outline-none hover:border-border-secondary hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <KanbanCardFace card={card} labels={labels} comments={comments} />
    </div>
  )
}
