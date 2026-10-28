import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'

import type { Comment } from '@/shared/lib/comments'

import type { KanbanCard, KanbanColumn } from '../model/types'
import { KanbanCardView } from './kanban-card'

interface KanbanColumnViewProps {
  column: KanbanColumn
  cards: KanbanCard[]
  comments: Comment[]
  onCreateCard: (title: string) => void
  onUpdateCard: (cardId: string, patch: Partial<Pick<KanbanCard, 'title' | 'description'>>) => void
  onDeleteCard: (cardId: string) => void
  onCreateCardComment: (cardId: string, body: string) => void
  onResolveCardComment: (commentId: string, resolved: boolean) => void
}

export function KanbanColumnView({
  column,
  cards,
  comments,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onCreateCardComment,
  onResolveCardComment,
}: KanbanColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const [newTitle, setNewTitle] = useState('')

  function submitNewCard() {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    onCreateCard(trimmed)
    setNewTitle('')
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-current/5 p-3">
      <h3 className="mb-2 px-1 text-sm font-semibold">
        {column.title} <span className="font-normal opacity-50">{cards.length}</span>
      </h3>

      <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-16 flex-1 flex-col gap-2 rounded p-1 ${isOver ? 'bg-current/10' : ''}`}
        >
          {cards.map((card) => (
            <KanbanCardView
              key={card.id}
              card={card}
              comments={comments}
              onUpdate={(patch) => onUpdateCard(card.id, patch)}
              onDelete={() => onDeleteCard(card.id)}
              onCreateComment={(body) => onCreateCardComment(card.id, body)}
              onResolveComment={onResolveCardComment}
            />
          ))}
        </div>
      </SortableContext>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitNewCard()
        }}
        className="mt-2"
      >
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onBlur={submitNewCard}
          placeholder="+ Add task"
          aria-label={`Add task to ${column.title}`}
          className="w-full rounded border border-transparent bg-transparent px-1 py-1 text-sm outline-none hover:border-current/20 focus:border-current/30"
        />
      </form>
    </div>
  )
}
