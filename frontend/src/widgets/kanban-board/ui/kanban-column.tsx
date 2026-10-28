import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Comment } from '@/shared/lib/comments'

import { COLUMN_COLORS, type KanbanCard, type KanbanColumn, type KanbanLabel } from '../model/types'
import { KanbanCardView } from './kanban-card'

interface KanbanColumnViewProps {
  column: KanbanColumn
  cards: KanbanCard[]
  labels: KanbanLabel[]
  comments: Comment[]
  /** Total cards in this column before filtering. */
  totalCount: number
  onCreateCard: (title: string) => void
  onOpenCard: (cardId: string) => void
  onUpdateColumn: (patch: Partial<Pick<KanbanColumn, 'title' | 'color'>>) => void
  onDeleteColumn: () => void
  readOnly: boolean
}

export function KanbanColumnView({
  column,
  cards,
  labels,
  comments,
  totalCount,
  onCreateCard,
  onOpenCard,
  onUpdateColumn,
  onDeleteColumn,
  readOnly,
}: KanbanColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (event: PointerEvent) => !menuRef.current?.contains(event.target as Node) && setMenuOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [menuOpen])

  function submitCard() {
    const title = draft.trim()
    if (title) onCreateCard(title)
    setDraft('')
  }

  return (
    <div className="flex max-h-full w-[288px] shrink-0 flex-col rounded-2xl bg-surface-secondary/70 dark:bg-surface/60">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: column.color ?? '#94a3b8' }} />
        {renaming ? (
          <input
            autoFocus
            defaultValue={column.title}
            onBlur={(event) => {
              if (event.target.value.trim()) onUpdateColumn({ title: event.target.value.trim() })
              setRenaming(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') setRenaming(false)
            }}
            className="h-7 min-w-0 flex-1 rounded-md border border-accent bg-field px-1.5 text-sm font-semibold outline-none"
          />
        ) : (
          <h3
            className="min-w-0 flex-1 cursor-text truncate text-sm font-semibold"
            onDoubleClick={() => !readOnly && setRenaming(true)}
            title={readOnly ? undefined : 'Double-click to rename'}
          >
            {column.title}
          </h3>
        )}
        <span className="rounded-full bg-default px-2 py-0.5 text-[11px] font-semibold text-muted tabular-nums">
          {cards.length === totalCount ? totalCount : `${cards.length}/${totalCount}`}
        </span>
        <div ref={menuRef} className={`relative ${readOnly ? 'hidden' : ''}`}>
          <button
            type="button"
            aria-label={`Column ${column.title} options`}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-default hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div className="app-shadow-lg absolute top-full right-0 z-20 mt-1 w-52 rounded-xl border border-border bg-overlay p-2 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setRenaming(true)
                  setMenuOpen(false)
                }}
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-default"
              >
                Rename
              </button>
              <p className="px-2 pt-2 pb-1.5 text-[11px] font-semibold text-muted uppercase">Color</p>
              <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                {COLUMN_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Column color ${color}`}
                    onClick={() => onUpdateColumn({ color })}
                    className={`h-5 w-5 rounded-full ring-offset-2 ring-offset-overlay ${
                      column.color === color ? 'ring-2 ring-accent' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  if (totalCount === 0 || window.confirm(`Delete "${column.title}" and its ${totalCount} cards?`)) {
                    onDeleteColumn()
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-danger hover:bg-danger-soft"
              >
                <Trash2 className="h-4 w-4" /> Delete column
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`scroll-thin flex min-h-20 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-1 transition-colors ${
            isOver ? 'rounded-xl bg-accent-soft/50' : ''
          }`}
        >
          {cards.map((card) => (
            <KanbanCardView
              key={card.id}
              card={card}
              labels={labels}
              comments={comments}
              onOpen={() => onOpenCard(card.id)}
            />
          ))}
        </div>
      </SortableContext>

      <div className={`p-2 ${readOnly ? 'hidden' : ''}`}>
        {adding ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submitCard()
            }}
            className="flex flex-col gap-2"
          >
            <textarea
              autoFocus
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submitCard()
                }
                if (event.key === 'Escape') setAdding(false)
              }}
              placeholder="What needs to be done?"
              className="resize-none rounded-xl border border-accent bg-surface px-3 py-2 text-sm shadow-sm outline-none"
            />
            <div className="flex gap-1.5">
              <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                Add card
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false)
                  setDraft('')
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-default"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-default hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Add a card
          </button>
        )}
      </div>
    </div>
  )
}
